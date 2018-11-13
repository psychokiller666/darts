// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
import _ from 'utils/underscore-min.js';

cc.Class({
    extends: cc.Component,

    properties: {
        touchEvent: cc.Node,
        dartPanel: cc.Node,
        dartSight: cc.Node,
        SightMark: cc.Node,
        sightStar: [cc.Node, cc.Node, cc.Node, cc.Node],
        thunderLayout: cc.Node,
        // thunder: cc.Prefab,
        playBack: cc.Node,
        handAnim: cc.Animation,
        playBackAnim: cc.Animation,
        camera: {
            default: null,
            type: cc.Camera
        },
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
            default: {}
        },
        _sightStarValue: {
            displayName: '准星前后跳动数值',
            default: []
        }
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    // LIFE-CYCLE CALLBACKS:

    _sightListener: function () {
        // 启用瞄准器
        this.touchEvent.on(cc.Node.EventType.TOUCH_START, (event) => {
            // console.log(event.getLocation())
            this.handAnim.play('fireHandStartAnim')
            this._sightInit(event.getLocation())
        })

        // 瞄准器移动
        this.touchEvent.on(cc.Node.EventType.TOUCH_MOVE, (event) => this._sightMove(event.getDelta()))

        // 释放瞄准器
        this.touchEvent.on(cc.Node.EventType.TOUCH_END, (event) => {
            this.handAnim.stop('fireHandStartAnim')
            this.handAnim.play('fireHandEndAnim')

            this.handAnim.on('finished', () => {
                // 瞄准器复位
                this.handAnim.off('finished')
            })
            this.playBackAnim.on('finished', () => {
                setTimeout(() => {
                    this.playBack.active = false
                    this.camera.zoomRatio = 1
                }, 800)
                this.playBackAnim.off('finished')
            })
            this._sightDestroy()
            // this._sightDestroy()
        })

        // 释放瞄准器
        this.touchEvent.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.handAnim.stop('fireHandStartAnim')
            this.handAnim.play('fireHandEndAnim')

            this.handAnim.on('finished', () => {
                // 瞄准器复位
                this.handAnim.off('finished')
            })
            this.playBackAnim.on('finished', () => {
                setTimeout(() => {
                    this.playBack.active = false
                    this.camera.zoomRatio = 1
                }, 800)
                this.playBackAnim.off('finished')
            })
            this._sightDestroy()
            // this._sightDestroy()
        })
    },

    // 初始化瞄准器
    _sightInit: function (position) {
        this.dartSight.active = true
        // console.log()
        this.dartSight.children[1].setPosition(position)
        // 前后前后动作
        this._sigthAimat()
        // 8个方向晃动动作
        this._sightActionBuff()
    },
    
    // 准星前后移动模拟呼吸动作
    _sigthAimat: function () {
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
    _cameraZoom2: function (dt) {
        if (this.playBack.active) {
            if (this.camera.zoomRatio <= 2) {
                this.camera.zoomRatio = this.camera.zoomRatio + dt
            } 
        }
    },
    _cameraZoom: function (dt) {
        if (this.dartSight.active) {
            if (this.camera.zoomRatio <= 1.5) {
                this.camera.zoomRatio = this.camera.zoomRatio + dt
            } 
            // console.log(dt)
            // this.camera.zoomRatio = 1.5
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
    _sightActionRoll: function () {
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
    _sightActionBuff: function () {
        this.dartSight.runAction(
            cc.repeatForever(
                cc.sequence(
                    this._sightActionRoll()
                )
            )
        )
    },

    // 瞄准器移动
    _sightMove: function (delta) {
        // 跟随
        this.SightMark.runAction(cc.moveBy(this._moveSpeed, delta))
    },

    // 销毁瞄准器 & 发射 & 复位
    _sightDestroy: function () {
        // 发射
        this._fire(this.dartSight.children[1].position)
        // 复位
        this.dartSight.active = false
        // this.playBack.active = false
        // 准星复位
        for (let key in this._sightStarValue) {
            this.sightStar[key].setPosition(this._sightStarValue[key].reset)
            cc.director.getActionManager().removeAllActionsFromTarget(this.sightStar[key])
        }
        cc.director.getActionManager().removeAllActionsFromTarget(this.dartSight)
        this.camera.zoomRatio = 1.5
    },

    _fireAnimation: function () {
        // 播放动画
        this.playBackAnim.play()
        this.playBack.active = true
    },
    onPlayBackEnd: function () {
        console.log('faaf')
    },

    _fire: function (position) {
        // 播放发射动画
        this._fireAnimation()
        console.log('发射坐标', position)
    },

    onLoad: function () {
        // 准星前后呼吸值
        this._sightStarSpeed = {
            first: .5,  // 第一次呼吸速度
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

    start: function () {
        // 监听
        this._sightListener()
        // 初始化扫雷
        // console.log(this.getComponent('Thunder'))
        // 调试模式
        // this._sightInit(cc.v2(498.375, 713.25))
    },

    update: function (dt) {
        // this._sightActionBuff(dt)
        // if ()
        this._cameraZoom(dt)
        this._cameraZoom2(dt)
    }
});
