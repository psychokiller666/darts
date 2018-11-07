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
// var _ = require('utils/underscore-min.js');

cc.Class({
    extends: cc.Component,

    properties: {
        dartPanel: cc.Node,
        dartSight: cc.Node,
        sightStar: [cc.Node, cc.Node, cc.Node, cc.Node],
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
        this.node.on(cc.Node.EventType.TOUCH_START, (event) => {
            console.log(event.getLocation())
            this._sightInit(event.getLocation())
        })

        // 瞄准器移动
        this.node.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
            this._sightMove(event.getDelta())
        })

        // 释放瞄准器
        this.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            this._sightDestroy()
        })

        // 释放瞄准器
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, (event) => {
            this._sightDestroy()
        })
    },

    // 初始化瞄准器
    _sightInit: function (position) {
        this.dartSight.active = true
        this.dartSight.setPosition(position)
        // 镜头拉近动作

        // 前后前后动作
        this._sigthAimat()
        // 8个方向晃动动作
        // this._sightActionBuff()
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
    
    // 9宫格，8个方向
    _sightActionRoll: function () {
        // 随机8个方向
        let tempArroy = []
        // 半径距离
        const radius = 5;
        // 当前位置 0 0
        const current = this.dartSight.position
        // 随机打乱方向
        const rollDirection = _.shuffle(this._dartSightValue)

        for (let item of rollDirection) {
            // 随机距离
            let rollDistance = _.random(1, radius)
            tempArroy.push(cc.moveTo(.5, cc.v2(current.x + (item.value + rollDistance) * item.direction.x, current.y + (item.value + rollDistance) * item.direction.y)))
        }
        console.log(tempArroy)
        return tempArroy
    },

    // 瞄准器晃动、模拟手抖动作 
    _sightActionBuff: function () {
        if (this.dartSight.active) {
            this.dartSight.runAction(
                cc.repeatForever(
                    cc.sequence(
                        this._sightActionRoll()
                    )
                )
            )
        }
    },

    // 瞄准器移动
    _sightMove: function (delta) {
        // 跟随
        this.dartSight.runAction(cc.moveBy(this._moveSpeed, delta))
    },

    // 销毁瞄准器 & 发射 & 复位
    _sightDestroy: function () {
        this.dartSight.active = false
        // 准星复位
        for (let key in this._sightStarValue) {
            this.sightStar[key].setPosition(this._sightStarValue[key].reset)
            cc.director.getActionManager().removeAllActionsFromTarget(this.sightStar[key])
        }

        cc.director.getActionManager().removeAllActionsFromTarget(this.dartSight)
    },

    onLoad: function () {
        // 准星前后呼吸值
        this._sightStarSpeed = {
            first: .5,  // 第一次呼吸速度
            value: .4   // 之后循环呼吸速度
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
            value: 2,
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
            value: 2,
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
            value: 2,
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
        this._sightListener()
        // 调试模式
        // this._sightInit(cc.v2(498.375, 713.25))
    },

    update: function (dt) {
        this._sightActionBuff(dt)
    }
});
