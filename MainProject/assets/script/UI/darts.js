// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        dartPanel: cc.Node,
        dartSight: cc.Node,
        sightStar: [cc.Node, cc.Node, cc.Node, cc.Node],
        _Movespeed: {
            displayName: '准星跟随速度',
            default: .4
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
            this._sightInit(event.getLocation())
        })

        // 瞄准器移动
        this.node.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
            // console.log(event.getLocation())
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
        // 前后前后动作
        this._sigthAimat()
        // 8个方向晃动动作
        this._sightActionBuff()
    },
    
    // 准星前后前后移动
    _sigthAimat: function () {
        let topAction = cc.moveBy(.5, cc.v2(0, 20))
        this.sightStar[0].runAction(topAction)

        let rigthAction = cc.moveBy(.5, cc.v2(20, 0))
        this.sightStar[1].runAction(rigthAction)

        let bottomAction = cc.moveBy(.5, cc.v2(0, -20))
        this.sightStar[2].runAction(bottomAction)

        let leftAction = cc.moveBy(.5, cc.v2(-20, 0))
        this.sightStar[3].runAction(leftAction)
    },
    
    _sightRollDirection: function (dt) {
        let max = Math.floor(Math.random() * 3 + 1)
        let min = Math.floor(Math.random() * 3 + 1)
        console.log(cc.v2(max, min), dt)
        return cc.v2(max, min)
    },

    // 瞄准器晃动动作
    _sightActionBuff: function () {
        // 晃动速度
        this._sightRollDirection()
    },

    // 瞄准器移动
    _sightMove: function (delta) {
        // 跟随
        this.dartSight.runAction(cc.moveBy(this._Movespeed, delta))
    },

    // 销毁瞄准器 & 发射 & 复位
    _sightDestroy: function () {
        this.dartSight.active = false
        // 准幸复位
        this.sightStar[0].setPosition(cc.v2(0, 0))
        this.sightStar[1].setPosition(cc.v2(20, -20))
        this.sightStar[2].setPosition(cc.v2(0, -40))
        this.sightStar[3].setPosition(cc.v2(-20, -20))
    },

    onLoad: function () {
        // 瞄准器默认关闭
        this._sightDestroy()
    },

    start: function () {
        this._sightListener()
    },

    update: function (dt) {
        // this._sightRollDirection(dt)
    }
});
