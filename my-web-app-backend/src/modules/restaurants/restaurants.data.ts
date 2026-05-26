export type RestaurantRecord = {
  name: string;
  latitude: number;
  longitude: number;
  notes: string[];
};

export const restaurants: RestaurantRecord[] = [
  {
    name: "鍾園精緻雲吞料理",
    latitude: 25.0243978,
    longitude: 121.5534716,
    notes: ["撈麵好吃，適合想吃麵食的午餐。", "請提早出發，尖峰時間可能要等。", "份量實在，適合快速吃飽。"],
  },
  {
    name: "食知味餐館",
    latitude: 25.0239475,
    longitude: 121.5518288,
    notes: ["百元小吃，預算友善。", "適合想快速解決午餐的時候。", "離公司近，平日午餐可列入輪替。"],
  },
  {
    name: "Demeter Coffee",
    latitude: 25.0227588,
    longitude: 121.5499815,
    notes: ["黑咖啡很好喝。", "適合午餐後想補咖啡因。", "也適合找地方短暫放空。"],
  },
  {
    name: "林記小吃",
    latitude: 25.0230221,
    longitude: 121.5499772,
    notes: ["炒飯記得加辣。", "鮮魚麵也有人推薦。", "適合想吃熱食和家常口味。"],
  },
  {
    name: "壽司爸",
    latitude: 25.0221323,
    longitude: 121.5536297,
    notes: ["想吃壽司時可以選。", "一定要預約，避免撲空。", "適合比較有計畫的午餐。"],
  },
  {
    name: "千松谷日本料理",
    latitude: 25.0229783,
    longitude: 121.5476247,
    notes: ["有商業午餐。", "建議提早訂位。", "適合想吃日式定食的時候。"],
  },
  {
    name: "十里坡",
    latitude: 25.0230067,
    longitude: 121.5468018,
    notes: ["俗又大碗，份量派可選。", "建議提早出發。", "適合餓到想吃飽的午餐。"],
  },
  {
    name: "蔣記家薌麵",
    latitude: 25.0263028,
    longitude: 121.5470214,
    notes: ["公司附近的麵食選項。", "適合想吃簡單熱湯麵。", "距離稍遠，適合不趕時間。"],
  },
  {
    name: "Uncle Burger 漢堡叔叔",
    latitude: 25.0244092,
    longitude: 121.5473712,
    notes: ["招牌漢堡好吃。", "注意早餐與午晚餐最後點餐時間。", "適合想吃美式或高熱量午餐。"],
  },
  {
    name: "PHO25 上癮河粉 X 越式泰式料理",
    latitude: 25.0216952,
    longitude: 121.5515901,
    notes: ["想吃越式或泰式時可以選。", "河粉類適合想吃清爽一點。", "離公司近，午餐時間好安排。"],
  },
  {
    name: "Li Jia Restaurant",
    latitude: 25.0221345,
    longitude: 121.5504334,
    notes: ["釜山豬肉湯飯很推薦。", "炸雞丼飯和馬鈴薯排骨湯飯也可以試。", "人多時建議提早去或先線上取號。"],
  },
  {
    name: "餓菱居",
    latitude: 25.0281561,
    longitude: 121.5466571,
    notes: ["炒飯和紅油抄手都很好吃。", "紅油皮蛋麵也被推薦。", "有點小遠且可能要等。"],
  },
  {
    name: "The House Breakfast",
    latitude: 25.0243468,
    longitude: 121.5467925,
    notes: ["薯餅塔必點。", "酥皮蛋餅很好吃。", "適合早午餐或想吃早餐店口味。"],
  },
  {
    name: "Ya Tsung (Kamonegi) Shinn Citrus",
    latitude: 25.0231249,
    longitude: 121.5544868,
    notes: ["鴨風味拉麵，湯頭濃郁。", "份量有點小，可考慮加飯。", "價格大約 240-300。"],
  },
  {
    name: "樂利早午餐",
    latitude: 25.0249149,
    longitude: 121.5523713,
    notes: ["炒泡麵很好吃。", "份量很多，價格大約 80-150。", "飲料和蛋餅是穩定早餐店口味。"],
  },
  {
    name: "5.TUNG",
    latitude: 25.0272566,
    longitude: 121.5515961,
    notes: ["千層甜點店，適合犒賞自己。", "推薦鐵觀音、香草、巧克力、提拉米蘇。", "滿三個以上可電話預約自取。"],
  },
  {
    name: "Ye Mao Restaurant - Liu Zhang Li Branch",
    latitude: 25.0224718,
    longitude: 121.5506917,
    notes: ["公司附近的餐廳選項。", "適合不知道吃什麼時加入抽籤。", "可搭配地圖確認營業狀況。"],
  },
  {
    name: "滬上雞莊麵食館(樂業店)",
    latitude: 25.0211495,
    longitude: 121.5515907,
    notes: ["四川口味但不會太辣。", "牛肉麵價格划算。", "推薦 E 套餐，有蔥油拌麵和小菜。"],
  },
  {
    name: "鯛魚燒工房 台灣大安店",
    latitude: 25.0220462,
    longitude: 121.5505325,
    notes: ["紅豆和奶油是穩定傳統口味。", "限定口味像蘋果肉桂可以試。", "建議先電話訂，適合飯後甜點。"],
  },
  {
    name: "武大郎豆漿店",
    latitude: 25.0231906,
    longitude: 121.5499831,
    notes: ["蛋餅煎得很酥脆。", "中午蒸餃有名。", "可以線上訂餐再自取。"],
  },
  {
    name: "136海鮮麵-臥龍店",
    latitude: 25.0209651,
    longitude: 121.5480617,
    notes: ["海鮮新鮮，蛋白質很豐富。", "多數人吃鍋燒油麵。", "價格大約 160-250。"],
  },
];
