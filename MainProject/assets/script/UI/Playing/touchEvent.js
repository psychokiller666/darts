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

const dartdata = [{
    score: 20,
    angleMin: 81,
    angleMax: 99,
}, {
    score: 1,
    angleMin: 63,
    angleMax: 81,
}, {
    score: 18,
    angleMin: 45,
    angleMax: 63,
}, {
    score: 4,
    angleMin: 27,
    angleMax: 45,
}, {
    score: 13,
    angleMin: 9,
    angleMax: 27,
}, {
    score: 6,
    angleMin: -9,
    angleMax: 9,
}, {
    score: 10,
    angleMin: -27,
    angleMax: -9,
}, {
    score: 15,
    angleMin: -45,
    angleMax: -27,
}, {
    score: 2,
    angleMin: -63,
    angleMax: -45,
}, {
    score: 17,
    angleMin: -81,
    angleMax: -63,
}, {
    score: 3,
    angleMin: -99,
    angleMax: -81,
}, {
    score: 19,
    angleMin: -117,
    angleMax: -99,
}, {
    score: 7,
    angleMin: -135,
    angleMax: -117,
}, {
    score: 16,
    angleMin: -153,
    angleMax: -135,
}, {
    score: 8,
    angleMin: -171,
    angleMax: -153,
}, {
    score: 11,
    angleMin: 171,
    angleMax: -171,
}, {
    score: 14,
    angleMin: 153,
    angleMax: 171,
}, {
    score: 9,
    angleMin: 135,
    angleMax: 153,
}, {
    score: 12,
    angleMin: 117,
    angleMax: 135,
}, {
    score: 5,
    angleMin: 99,
    angleMax: 117,
}]

let totalScore = []

cc.Class({
    extends: cc.Component,

    properties: {
        touchEvent: cc.Node,
        sightStar: [cc.Node, cc.Node, cc.Node, cc.Node],
        dartSight: cc.Node,
        sightMove: cc.Node,
        dartPrefab: cc.Prefab,
        SightMark: cc.Node,
        handAnim: cc.Animation,
        playBackAnim: cc.Animation,
        dartPanel: cc.Node,
        scoreLabel: cc.Label,
        dev: cc.Node,
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
        // this.SightMark.active = true
        this.sightMove.active = true
        this.handAnim.node.active = true
        // 设置定位
        // 设置偏移量
        
        this.sightMove.setPosition(position.x + _.random(-40, -120), position.y + _.random(40, 120))

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

            // 获取得分 & 贴图
            this._addDarts(this._getScore(this.sightMove.position))
            
            // 复位
            this._sightReset()
        })
    },

    // 计算得分
    // 返回 分数，坐标贴图位置
    _getScore: function (position) {
        // 有偏移量 （模拟手抖动的偏移量加进去）
        position = cc.v2(position.x + this.sightMove.getChildByName('breathing').position.x, position.y + 25 +this.sightMove.getChildByName('breathing').position.y)
        
        // console.log(position)
        // 获取中心点
        const dartPanelCenter = this.dartPanel.getChildByName('background').getBoundingBox().center        
        // 计算弧度
        const angle = Math.atan2((position.y - dartPanelCenter.y), (position.x - dartPanelCenter.x))
        // 计算角度
        const theta = angle * (180 / Math.PI)

        //点与圆心的距离
        var distance = Math.sqrt(Math.pow(position.x - dartPanelCenter.x, 2) + Math.pow(position.y - dartPanelCenter.y, 2))
        //圆的半径
        var radius = this.dartPanel.getChildByName('background').getContentSize().width / 2

        // console.log(cc.v2(point.x, point.y))
        console.log(distance)
        //如果点与圆心距离小于圆的半径,返回true  
        if(radius > distance) {
            // 判断在区域
            if (distance < 10) {
                // alert('50分')
                return {
                    score: 50,
                    dartPosition: position
                };
            } else if (distance > 10 && distance < 20) {
                // alert('25分')
                return {
                    score: 25,
                    dartPosition: position
                };
            } else if (distance < 180) {
                for (let item of dartdata) {
                    if (theta <= item.angleMax && theta >= item.angleMin) {
                        // 三倍区
                        if (distance > 100 && distance < 110) {
                            return {
                                score: item.score * 3,
                                dartPosition: position
                            }
                        } else if (distance > 170 && distance < 180) {
                            // 2倍区
                            return {
                                score: item.score * 2,
                                dartPosition: position
                            }
                        } else {
                            return {
                                score: item.score * 1,
                                dartPosition: position
                            }
                        }
                    }
                    // 特殊值 11对比
                    if (item.score == 11) {
                        if ((theta <= 180 && theta >= item.angleMin) || (theta >= -180 && theta <= item.angleMax)) {
                            // 三倍区
                            if (distance > 100 && distance < 110) {
                                return {
                                    score: item.score * 3,
                                    dartPosition: position
                                }
                            } else if (distance > 170 && distance < 180) {
                                // 2倍区
                                return {
                                    score: item.score * 2,
                                    dartPosition: position
                                }
                            } else {
                                return {
                                    score: item.score * 1,
                                    dartPosition: position
                                }
                            }
                        }
                    }
                }
            } else {
                // alert('脱靶')
                return {
                    score: 0,
                    dartPosition: position
                }
            }
        } else {
            // alert('脱靶')
            return {
                score: 0,
                dartPosition: position
            }
        }
        // 贴图
        // this._addDarts(position)
        

    },
    // 贴图， 计算总分数
    _addDarts: function (darts) {
        totalScore.push(darts)
        if (totalScore.length >= 3) {
            if (CC_WECHATGAME) {
                wx.showToast({
                    title: '总得分：' + (parseInt(this.scoreLabel.string) + parseInt(totalScore[totalScore.length - 1].score)),
                    icon: 'success',
                    duration: 2000
                })
            } else {
                alert('总得分：' + (parseInt(this.scoreLabel.string) + parseInt(totalScore[totalScore.length - 1].score)))
            }
            // 清空
            totalScore = []
            this.scoreLabel.string = 0
            this.dartPanel.getChildByName('Child').removeAllChildren()
        } else {
            var newDarts = cc.instantiate(this.dartPrefab)
            this.dartPanel.getChildByName('Child').addChild(newDarts)
            newDarts.setPosition(darts.dartPosition)
            // 加分
            this.scoreLabel.string = parseInt(this.scoreLabel.string) + parseInt(totalScore[totalScore.length - 1].score)
        }

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
            tempArroy.push(cc.moveBy(.6, cc.v2((item.value + rollDistance) * item.direction.x, (item.value + rollDistance) * item.direction.y)))
            tempArroy.push(cc.moveBy(.5, cc.v2((item.value + rollDistance) * item.direction.x, (item.value + rollDistance) * item.direction.y)).reverse())
        }
        return tempArroy
    },

    // 瞄准器晃动、模拟手抖动作 
    _sigthBreatheActionBuff: function () {
        this.sightMove.getChildByName('breathing').runAction(
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
        this.sightMove.runAction(cc.moveBy(this._moveSpeed, delta))
        // console.log('发射坐标mmm',this.sightMove.position.x + this.sightMove.getChildByName('breathing').position.x, this.sightMove.position.y + 25 +this.sightMove.getChildByName('breathing').position.y)
        // console.log(this.sightMove.getChildByName('breathing').position)
    },

    _dartFire: function () {
        // 播放扔手动画
        this.handAnim.play('fireHandEndAnim')
    },

    // 释放瞄准器 & 发射
    _sightDestroy: function () {
        // 准星隐藏
        // this.SightMark.active = false
        this.sightMove.active = false
        // 发射
        this._dartFire()
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
        cc.director.getActionManager().removeAllActionsFromTarget(this.sightMove)
        // 瞄准器隐藏
        this.dartSight.active = false
        // 摄像头复位 
        this.camera.zoomRatio = 1
        // 注销动画监听
        this.handAnim.off('finished')
        this.playBackAnim.off('finished')
        this.sightMove.setPosition(cc.v2(0, 0))
        this.sightMove.getChildByName('breathing').setPosition(cc.v2(0, 0))
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

    _devYellowSwitch: function () {
        if (this.SightMark.getChildByName('center').active) {
            this.SightMark.getChildByName('center').active = false
        } else {
            this.SightMark.getChildByName('center').active = true
        }
    },



    _devValueOne: function () {
        this._updateValue(1)
    },
    _devValueTwo: function () {
        this._updateValue(1.5)
    },
    _devValueThree: function () {
        this._updateValue(2)
    },
    _devValueFour: function () {
        this._updateValue(3)
    },

    _updateValue: function (multiple) {
        // 准星前后呼吸值
        this._sightStarSpeed = {
            first: .6 * multiple,  // 第一次呼吸速度
            value: .18 * multiple      // 之后循环呼吸速度
        }
        
        // 手抖方向及范围
        // 手抖值 顺时针方向
        this._dartSightValue = [{
            name: 'center',
            value: 2 * multiple,
            direction: {
                x: 0,
                y: 0
            }
        },{
            name: 'top',
            value: 2 * multiple,
            direction: {
                x: 0,
                y: 1
            }
        },{
            name: 'topRight',
            value: 2 * multiple,
            direction: {
                x: 1,
                y: 1
            }
        },{
            name: 'right',
            value: 2 * multiple,
            direction: {
                x: 1,
                y: 0
            }
        },{
            name: 'rightBottom',
            value: 2 * multiple,
            direction: {
                x: 1,
                y: -1
            }
        },{
            name: 'bottom',
            value: 2 * multiple,
            direction: {
                x: 0,
                y: -1
            }
        },{
            name: 'leftBottom',
            value: 2 * multiple,
            direction: {
                x: -1,
                y: -1
            }
        },{
            name: 'left',
            value: 2 * multiple,
            direction: {
                x: -1,
                y: 0
            }
        },{
            name: 'leftTop',
            value: 2 * multiple,
            direction: {
                x: -1,
                y: -1
            }
        }]
    },
    
    onLoad: function () {

        // 初学者数值
        // this._updateValue(3)

        // this._updateValue(1)

        this._updateValue(1)

        // this._updateValue(3)


        // 准星前后跳动数值
        this._sightStarValue = [{
            name: 'top',
            reset: cc.v2(0, 0),
            value: cc.v2(0, 40)
        },{
            name: 'right',
            reset: cc.v2(25, -25),
            value: cc.v2(40, 0)
        },{
            name: 'bottom',
            reset: cc.v2(0, -50),
            value: cc.v2(0, -50)
        },{
            name: 'left',
            reset: cc.v2(-25, -25),
            value: cc.v2(-40, 0)
        }]
    },

    start () {
        // 初始化监听
        this._sightListener()

        this.dev.getChildByName('yellow').on('click', this._devYellowSwitch, this)

        this.dev.getChildByName('One').on('click', this._devValueOne, this)
        this.dev.getChildByName('Two').on('click', this._devValueTwo, this)
        this.dev.getChildByName('Three').on('click', this._devValueThree, this)
        this.dev.getChildByName('Four').on('click', this._devValueFour, this)
    },
    
    update (dt) {
        // 摄像机拉近
        this._sightCameraZoom(dt)
        this._playBackAnimCameraZoom(dt)
    },
});
