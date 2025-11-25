const coffeeData = [
    {
        id: 'espresso', name: 'Espresso\n意式浓缩', icon: '☕', image: 'images/espresso.jpg',
        desc: '纯粹的浓缩咖啡。不可调节配比。',
        isAdjustable: false,
        baseParts: [{ name: '浓缩', val:'36g', color: 'var(--espresso-color)' }],
        steps: ['研磨成极细粉','布粉并压实','萃取25-30秒，获得36g液重']
    },
    {
        id: 'americano', name: 'Americano\n美式咖啡', icon: '💧', image: 'images/americano.jpg',
        desc: '浓缩 + 热水。调整比例可改变浓度。',
        isAdjustable: true, mixerName: '热水', mixerColor: 'var(--water-color)',
        steps: ['杯中接热水','缓慢倒入浓缩','保留表面油脂']
    },
    {
        id: 'latte', name: 'Latte\n拿铁咖啡', icon: '🥛', image: 'images/latte.jpg',
        desc: '浓缩 + 大量牛奶 + 薄奶泡。',
        isAdjustable: true, mixerName:'热牛奶', mixerColor:'var(--milk-color)',
        hasFoam:true, foamVal:0.5,
        steps:['萃取浓缩基底','打发薄奶泡(0.5cm)','融合并拉花']
    },
    {
        id:'cappuccino', name:'Cappuccino\n卡布奇诺', icon:'☁️', image: 'images/cappuccino.jpg',
        desc:'浓缩 + 牛奶 + 厚奶泡。',
        isAdjustable:true, mixerName:'热牛奶', mixerColor:'var(--milk-color)',
        hasFoam:true, foamVal:2,
        steps:['萃取浓缩基底','打发厚奶泡(2cm)','倒入杯中，奶泡分层']
    },
    {
        id:'flatwhite', name:'Flat White\n澳白', icon:'🌿', image: 'images/flatwhite.jpg',
        desc:'短萃取浓缩 + 薄牛奶。',
        isAdjustable:true, mixerName:'牛奶', mixerColor:'var(--milk-color)',
        hasFoam:true, foamVal:0.2,
        steps:['萃取Ristretto(短萃取)','打发丝滑微奶泡','融合均匀']
    },
    {
        id:'Orange Americano', name:'Orange Americano🔥\n热柑橘美式', icon:'🍊', image: 'images/OrangeAmericano.jpg',
        desc:'糖浆 + 橙汁 + 燕麦奶 + 浓缩 + 橘子干等',
        isAdjustable:true, mixerName:'橙汁/糖浆', mixerColor:'var(--orange-color)',
        hasFoam:true, foamVal:0,
        steps:["糖浆:原味糖浆6g、橙汁30g","燕麦奶:280g", "浓缩:双份MB","其他:橘子干1片"]
    }
];
