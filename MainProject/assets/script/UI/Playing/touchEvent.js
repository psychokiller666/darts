// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
import _ from '../../utils/underscore-min.js';

cc.Class({
    extends: cc.Component,

    properties: {
        touchEvent: cc.Node,
        sightStar: [cc.Node, cc.Node, cc.Node, cc.Node],
        dartSight: cc.Node,
        SightMark: cc.Node,
        handAnim: cc.Animation,
        playBackAnim: cc.Animation,
        camera: cc.Camera,
        _dartSightValue: {
            displayName: '模拟手抖数值，8个方向',
            default: []
        },
        _moveSpeed: {
            displayName: '准星跟随速度',
            default: .4
        },
        _sightStarSpeed: {
            displayName: '准星前后呼吸值',
            type: cc.Enum,
            default: {}
        },
        _sightStarValue: {
            displayName: '准星前后跳动数值',
            default: []
        },
        _sightStarCameraZoom: {
            displayName: '准星拉近距离',
            default: 1.5
        },
        _playBackAnimZoom: {
            displayName: '回放拉近距离',
            default: 2
        },
    },

    // LIFE-CYCLE CALLBACKS:
    _sightListener: function () {
        // 启用瞄准器
        this.touchEvent.on(cc.Node.EventType.TOUCH_START, (event) => {
            // 当手部、回放动画未完成时，不能点击
            if (this.handAnim.node.active || this.playBackAnim.node.active) return false
            this._sightInit(event.getLocation())   
        })

        // 瞄准器移动
        this.touchEvent.on(cc.Node.EventType.TOUCH_MOVE, (event) => this._sightMove(event.getDelta()))

        // 释放瞄准器 (发射)
        this.touchEvent.on(cc.Node.EventType.TOUCH_END, () => this._sightDestroy())
        this.touchEvent.on(cc.Node.EventType.TOUCH_CANCEL, () => this._sightDestroy())
    },

    // 初始化瞄准器
    _sightInit: function (position) {
        // 瞄准器激活
        this.dartSight.active = true
        this.SightMark.active = true
        this.handAnim.node.active = true
        // 设置定位
        this.dartSight.children[1].setPosition(position)

        // 播放手部动画
        this.handAnim.play('fireHandStartAnim')
        
        // 准星呼吸动作
        this._sigthBreatheAction()
        
        // 8个方向晃动动作
        this._sigthBreatheActionBuff()
        
        // 注册监听手部动画
        // 扔手动作完成后，使用回放动画
        this.handAnim.on('finished', () => {
            // 隐藏手部动画
            this.handAnim.node.active = false
            // 启动回放动画
            this.playBackAnim.node.active = true
            this.playBackAnim.play()
        })
        this.playBackAnim.on('finished', () => {
            // 隐藏回放动画
            this.playBackAnim.node.active = false
            // 复位
            this._sightReset()
        })
    },
    
    // 准星前后移动模拟呼吸动作
    _sigthBreatheAction: function () {
        for(let key in this._sightStarValue) {
            this.sightStar[key].runAction(cc.sequence(
                cc.moveBy(this._sightStarSpeed.first, this._sightStarValue[key].value, 0),
                cc.moveBy(this._sightStarSpeed.first, this._sightStarValue[key].value, 0).reverse(),
                cc.callFunc(() => {
                    this.sightStar[key].runAction(cc.repeatForever(
                        cc.sequence(
                            cc.moveBy(this._sightStarSpeed.value, this._sightStarValue[key].value, 0),
                            cc.moveBy(this._sightStarSpeed.value, this._sightStarValue[key].value, 0).reverse(),
                        )
                    ))
                }, this.sightStar[key])
            ))
        }
    },

    // 模拟手抖动数值计算
    // 9宫格，8个方向
    // -----------------
    // | 左上| 上 | 右上 |
    // | 左  | 中 | 右  |
    // | 左下| 下 | 右下 |
    // -----------------
    // 数值计算方式
    // (方向数值 + 随机距离) * 偏移方向
    // 举例：(_dartSightValue.value + rollDistance) * _dartSightValue.direction.x or _dartSightValue.direction.y
    _sigthBreatheActionBuffRoll: function () {
        // 随机8个方向
        let tempArroy = []
        // 规定距离
        const radius = 10;
        // 随机打乱方向
        const rollDirection = _.shuffle(this._dartSightValue)

        for (let item of rollDirection) {
            // 随机距离
            let rollDistance = _.random(1, radius)
            tempArroy.push(cc.moveBy(.5, cc.v2((item.value + rollDistance) * item.direction.x, (item.value + rollDistance) * item.direction.y)))
        }
        return tempArroy
    },

    // 瞄准器晃动、模拟手抖动作 
    _sigthBreatheActionBuff: function () {
        this.dartSight.runAction(
            cc.repeatForever(
                cc.sequence(
                    this._sigthBreatheActionBuffRoll()
                )
            )
        )
    },

    // 瞄准器移动
    _sightMove: function (delta) {
        // 跟随
        this.SightMark.runAction(cc.moveBy(this._moveSpeed, delta))
    },

    _dartFire: function (position) {
        // 播放扔手动画
        this.handAnim.play('fireHandEndAnim')
        // 添加node到镖盘
    },

    // 释放瞄准器 & 发射
    _sightDestroy: function () {
        // 准星隐藏
        this.SightMark.active = false
        // 发射
        this._dartFire(this.dartSight.children[1].position)
    },

    // 重置 & 复位
    _sightReset: function () {
        // 准星复位
        for (let key in this._sightStarValue) {
            this.sightStar[key].setPosition(this._sightStarValue[key].reset)
            cc.director.getActionManager().removeAllActionsFromTarget(this.sightStar[key])
        }
        // 删除动作
        cc.director.getActionManager().removeAllActionsFromTarget(this.dartSight) 
        // 瞄准器隐藏
        this.dartSight.active = false
        // 摄像头复位 
        this.camera.zoomRatio = 1
        // 注销动画监听
        this.handAnim.off('finished')
        this.playBackAnim.off('finished')
    },

    // 镜头拉近
    _sightCameraZoom: function (dt) {
        if (this.dartSight.active) {
            if (this.camera.zoomRatio <= this._sightStarCameraZoom) {
                this.camera.zoomRatio = this.camera.zoomRatio + dt
            }
        }
    },
    
    _playBackAnimCameraZoom: function (dt) {
        if (this.playBackAnim.node.active) {
            if (this.camera.zoomRatio <= this._playBackAnimZoom) {
                this.camera.zoomRatio = this.camera.zoomRatio + dt
            } 
        }
    },
    
    onLoad: function () {
        // 准星前后呼吸值
        this._sightStarSpeed = {
            first: 1,  // 第一次呼吸速度
            value: .3   // 之后循环呼吸速度
        }

        // 准星前后跳动数值
        this._sightStarValue = [{
            name: 'top',
            reset: cc.v2(0, 0),
            value: cc.v2(0, 40)
        },{
            name: 'right',
            reset: cc.v2(20, -20),
            value: cc.v2(40, 0)
        },{
            name: 'bottom',
            reset: cc.v2(0, -40),
            value: cc.v2(0, -40)
        },{
            name: 'left',
            reset: cc.v2(-20, -20),
            value: cc.v2(-40, 0)
        }]

        // 手抖值 顺时针方向
        this._dartSightValue = [{
            name: 'top',
            value: 5,
            direction: {
                x: 0,
                y: 1
            }
        },{
            name: 'topRight',
            value: 2,
            direction: {
                x: 1,
                y: 1
            }
        },{
            name: 'right',
            value: 8,
            direction: {
                x: 1,
                y: 0
            }
        },{
            name: 'rightBottom',
            value: 2,
            direction: {
                x: 1,
                y: -1
            }
        },{
            name: 'bottom',
            value: 10,
            direction: {
                x: 0,
                y: -1
            }
        },{
            name: 'leftBottom',
            value: 2,
            direction: {
                x: -1,
                y: -1
            }
        },{
            name: 'left',
            value: 2,
            direction: {
                x: -1,
                y: 0
            }
        },{
            name: 'leftTop',
            value: 2,
            direction: {
                x: -1,
                y: -1
            }
        }]

        // 瞄准器默认关闭
        // this._sightDestroy()
    },

    start () {
        // 初始化监听
        this._sightListener()
    },

    update (dt) {
        // 摄像机拉近
        this._sightCameraZoom(dt)
        this._playBackAnimCameraZoom(dt)
    },
});
