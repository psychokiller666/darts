/**
 * Created by wanan on 15-3-26.
 */

var CircleCollisionWithCircleLayer = cc.Layer.extend({
    ctor: function()
    {
        this._super();

        var winSize = cc.winSize;

        var backlabel = new cc.LabelTTF("返回", "Arial", 36);
        var backMenuItem = new cc.MenuItemLabel(backlabel, function()
        {
            cc.director.popScene();
        }, this);
        var menu = new cc.Menu(backMenuItem);
        menu.setPosition(cc.p(50, winSize.height - 20));
        this.addChild(menu);

        var circle1 = new cc.Sprite(res.circle_png);
        circle1.setPosition(cc.p(winSize.width / 2, winSize.height / 2));
        this.addChild(circle1, 0, 101);

        var circle2 = new cc.Sprite(res.circle_png);
        circle2.setPosition(cc.p(150, winSize.height / 2));
        this.addChild(circle2, 0, 102);

        return true;
    },

    onEnter: function()
    {
        this._super();

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function(touch, event)
            {
                return true;
            },
            onTouchMoved: function(touch, event)
            {
                var target = event.getCurrentTarget();
                var circle1 = target.getChildByTag(101);
                var circle2 = target.getChildByTag(102);
                circle2.setPosition(touch.getLocation());
                target.isCollision(circle1, circle2);
            },
            onTouchEnded: function(touch, event)
            {
                var target = event.getCurrentTarget();
                var circle1 = target.getChildByTag(101);
                var circle2 = target.getChildByTag(102);
                circle1.setColor(cc.color(255, 255, 255, 255));
                circle2.setColor(cc.color(255, 255, 255, 255));
                circle2.setPosition(cc.p(150, circle1.getPositionY()));
            }
        }, this);
    },

    isCollision: function(circle1, circle2)
    {
        //圆心与圆心的距离
        var distance = Math.sqrt(Math.pow(circle1.x - circle2.x, 2) + Math.pow(circle1.y - circle2.y, 2));

        //圆心半径
        var r1 = circle1.getContentSize().width / 2;
        var r2 = circle2.getContentSize().width / 2;

        //如果圆心与圆心距离小于两圆的半径,返回true
        if(r1 + r2 > distance)
        {
            circle1.setColor(cc.color(255, 0, 0, 255));
            circle2.setColor(cc.color(255, 0, 0, 255));
        }
        else
        {
            circle1.setColor(cc.color(255, 255, 255, 255));
            circle2.setColor(cc.color(255, 255, 255, 255));
        }
    },

    onExit: function()
    {
        this._super();
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ONE);
    }
});

var CircleCollisionWithCircleScene = cc.Scene.extend({
    onEnter: function()
    {
        this._super();
        this.addChild(new CircleCollisionWithCircleLayer());
    }
});