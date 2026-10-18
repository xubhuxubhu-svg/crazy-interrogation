/* 瘋狂審訊室・遊戲引擎：五個案件、語意判斷、AI 審問官與 AI 嫌犯、評分。瀏覽器與伺服器共用 */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>Array.isArray(a)?a[Math.floor(Math.random()*a.length)]:a;
const has=(s,list)=>list.some(k=>s.includes(k));

/* 語音辨識常見的同音誤聽，先修正再比對 */
const FIX={'隻聞':'指紋','只聞':'指紋','紙紋':'指紋','止紋':'指紋','知文':'指紋','監事器':'監視器','見識器':'監視器','間是器':'監視器','門機':'門禁','門今':'門禁','刷開':'刷卡',
 '前裝':'錢莊','錢裝':'錢莊','前莊':'錢莊','賭摘':'賭債','睹債':'賭債','做牢':'坐牢','座牢':'坐牢','自守':'自首','字首':'自首','油同':'油桶','由桶':'油桶','打火雞':'打火機',
 '超上':'超商','假專':'假鑽','假賺':'假鑽','錢包':'錢','顏料份析':'顏料分析','言料':'顏料','停撥':'停播','陽明三':'陽明山','安眠要':'安眠藥','暗眠藥':'安眠藥','企化':'企劃'};
const norm=s=>{s=String(s||'').replace(/[\s，。！？、,.!?；;：:「」"'（）()…—～~]/g,''); for(const k in FIX) s=s.split(k).join(FIX[k]); return s;};

const KW={
 alibi:['那天','那晚','晚上','凌晨','在哪','去哪','去了哪','哪裡','人在','跑去','行蹤','幾點','不在場','做什麼','做了什麼','幹嘛','回家','下班','之後','離開'],
 threat:['坐牢','關起來','判刑','法官','後果','起訴','犯罪','監獄','關你','老實','重罪','關很久'],
 empathy:['家人','女兒','兒子','小孩','孩子','老婆','太太','先生','爸媽','理解','幫你','從輕','自首','機會','坦白','難處','苦衷','放心','不得已','辛苦'],
 bluff:['都知道','全都說','承認了','同夥','證據確鑿','別裝','招了','不要再裝','騙不了','早就知道'],
 insult:['笨','白癡','廢物','混蛋','垃圾','王八','智障'],
 flatter:['厲害','聰明','有品味','了不起','佩服','天才','成功','有錢人','見過世面','專業']
};

/* 個性：影響各種戰術的效果 */
const PERS={
 cry:{name:'膽小型',threat:1.2,empathy:1.25,bluff:1,flatter:0.4,contra:1,overAt:3},
 hyst:{name:'暴躁型',threat:0.7,empathy:1.4,bluff:0.9,flatter:0.3,contra:1,overAt:2},
 roar:{name:'自大型',threat:0.6,empathy:0.8,bluff:0.5,flatter:2.2,contra:1.1,overAt:3},
 mad:{name:'冷靜型',threat:0.3,empathy:0.75,bluff:0.8,flatter:0.2,contra:1.6,overAt:2}
};
const BANK={
 cry:{threat:{low:['坐、坐牢？你們不能亂抓人……'],mid:['你、你不要嚇我……'],high:['我不想坐牢……我家人怎麼辦……'],over:['你們一直嚇我，我、我要找律師……']},
  empathy:{low:['……你們真的會聽我說嗎？'],mid:['你……你真的會幫我說話？'],high:['如果我說了……真的可以從輕發落嗎？']},
  bluff:{fail:['你、你在唬我吧？證據呢？'],ok:['他、他們全都說了？不可能……']},
  flatter:{low:['我……我沒你說的那麼厲害啦……'],mid:['……'],high:['……']},
  insult:['你、你怎麼可以罵人……我要找律師……'],
  other:{low:['我、我不知道你在說什麼。','你到底想問什麼？'],mid:['可以……可以給我一杯水嗎？','我真的不知道……'],high:['拜託……讓我休息一下……']},
  repeat:['這、這個你剛剛問過了……']},
 hyst:{threat:{low:['你威脅我？來啊！看誰怕誰！'],mid:['你再說一次試試看！'],high:['你、你們不要逼我！'],over:['又來！你們除了恐嚇還會什麼！']},
  empathy:{low:['少假惺惺了！'],mid:['……你真的懂我的感受？'],high:['我只是……我只是氣不過而已……']},
  bluff:{fail:['唬誰啊！拿證據出來！'],ok:['誰？誰出賣我？']},
  flatter:{low:['少拍馬屁，有話直說！'],mid:['少來這套！'],high:['……']},
  insult:['你罵誰！再說一次！'],
  other:{low:['問完了沒？我還要做生意！'],mid:['你到底想怎樣！'],high:['煩死了！不要再問了！']},
  repeat:['講幾遍了你聽不懂嗎！']},
 roar:{threat:{low:['坐牢？我的律師團會讓你丟工作。'],mid:['你知道我爸是誰嗎？'],high:['你、你們敢動我試試看……'],over:['同樣的恐嚇講第三次，你不膩嗎？']},
  empathy:{low:['我不需要你的同情。'],mid:['……你倒是比其他警察有禮貌。'],high:['……如果我配合，消息可以不要曝光嗎？']},
  bluff:{fail:['哈，這種小把戲對我沒用。'],ok:['不可能……他們不敢出賣我……']},
  flatter:{low:['那當然，我的品味可是一流的。'],mid:['哼，算你有眼光。我可是很懂行情的。'],high:['……你說得對，我本來就比那些人聰明。']},
  insult:['你這種小警察也配罵我？'],
  other:{low:['我時間很寶貴，說重點。'],mid:['這種問題也值得問？'],high:['……你、你到底想知道什麼？']},
  repeat:['我已經回答過了，你記性不太好？']},
 mad:{threat:{low:['威脅對我沒有用，警官。'],mid:['你應該很清楚，這種話上不了法庭。'],high:['……呵，你的語氣變急了。'],over:['恐嚇已經是第三次了，我會請律師記下來。']},
  empathy:{low:['你想打感情牌？省省吧。'],mid:['……你真的想知道我的理由？'],high:['……從來沒有人問過我，為什麼要這麼做。']},
  bluff:{fail:['你在虛張聲勢。你的手指在發抖。'],ok:['……有意思。你們比我想的還快。']},
  flatter:{low:['恭維對我沒有意義。'],mid:['……'],high:['……']},
  insult:['情緒化的警察，很難辦好案。'],
  other:{low:['請問你的問題是？'],mid:['……我不太懂你的意思。'],high:['……繼續啊，我在聽。']},
  repeat:['同樣的問題，同樣的答案。']}
};

/* AI 審問官的台詞 */
const INTER={
 open:['我是負責這個案子的警官。我們好好聊聊吧。','坐吧。接下來的問題，你最好老實回答。'],
 empathy:['想想你的家人吧。現在坦白，我會幫你爭取從輕發落。','我知道你有苦衷，說出來會輕鬆很多。'],
 bluff:['你的同夥已經全都說了，你還要撐嗎？','我們早就知道了，只是想聽你親口說。'],
 threat:['你知道這是重罪吧？不說實話，你會關很久。','法官最討厭不老實的人，後果你自己想清楚。'],
 press:['我再問一次，那天到底發生了什麼事？','你的說法漏洞百出，老實說吧。','你覺得法官會相信你這套說詞嗎？'],
 contraQ:'你剛剛說是{a}點，之前又說{b}點，到底哪個才是真的？',
 react:{excuse:['哼，說得倒是好聽。','這個解釋……我先記下來。','是嗎？我們會去查證。'],contra:['等一下，你剛剛說的可不是這樣！'],leak:['等等……你剛剛說了什麼？','有意思，這個細節我們可沒告訴過你。'],
  weak:['你的臉色變了喔。','這種解釋你自己相信嗎？'],silent:['不說話？沉默只會讓你更可疑。'],lawyer:['想找律師？可以，但現在先回答問題。'],calm:['嗯。','繼續。','是嗎？'],
  broke:['終於說實話了。'],held:['……今天就先到這裡。'] }
};

const CONFESS=/是我(做|拿|偷|放|幹|燒|換|藏|弄|帶走|關)|我(承認|認罪|招了)|我(拿|偷|燒|換|藏)的|東西是我|是我啦|就是我/;

const CASES=[
{
 id:'c1',title:'星辰科技金庫失竊案',stars:1,resist:1.0,
 suspect:{name:'林志明',age:38,job:'公司會計',type:'cry'},
 brief:'10月15日深夜，星辰科技財務室保險箱裡的80萬元現金不翼而飛。公司會計林志明是頭號嫌疑人，但他堅稱自己是清白的。',
 secret:'你在10月15日22點12分刷卡進入財務室，從保險箱拿走80萬現金去還錢莊賭債，錢藏在你車子的後車廂。',
 cover:'那天你九點就下班回家，在家看電視，沒再回過公司。',
 coverKw:['九點','9點','回家','看電視','在家'],coverTime:9,
 open:'警察先生，你們抓錯人了吧？我時間很寶貴，有話快說。',
 alibiQ:'10月15日晚上，你人在哪裡？做了什麼？',
 alibi:{first:'那天晚上？我九點就下班回家了，在家看電視。',again:['我說過了，九點就回家了！','你要我講幾次？我九點就到家了。']},
 evidence:[
  {id:'cctv',name:'走廊監視器畫面',desc:'10月15日22:10，一名穿灰色外套的男子走向財務室，臉部模糊。',kw:['監視器','監視','錄影','攝影機','畫面','鏡頭','影片','灰色外套'],gain:10,unlock:'start',
   react:{low:['監視器？那個走廊的監視器根本拍不清楚吧。','穿灰色外套的人那麼多，憑什麼說是我？'],mid:['那、那個人……身材跟很多人都很像啊……'],high:['不要再放那段畫面了……']},
   excuse:['很多人','不是我','看不清','模糊','不清楚'],hint:'說畫面太模糊，穿灰外套的人很多',aiAsk:'這是走廊監視器，22點10分，一個穿灰色外套的男人走向財務室。你也有灰色外套吧？'},
  {id:'card',name:'門禁刷卡紀錄',desc:'林志明的員工卡在22:12刷開了財務室的門。',kw:['刷卡','門禁','卡片','識別證','員工卡','進出紀錄','打卡'],gain:12,unlock:'alibi',contra:true,
   react:{low:['刷卡紀錄？我……我可能是回去拿東西而已。'],mid:['我……我只是回去拿手機……'],high:['那張卡……是我的沒錯……']},contraLine:'十、十點十二分？……那、那是我記錯時間了！我是說……',
   excuse:['拿東西','忘了','手機','借給','掉了','被偷'],hint:'說你回公司拿忘記帶的手機',aiAsk:'你的員工卡在22點12分刷開了財務室的門。你不是九點就回家了？'},
  {id:'print',name:'鈔票袋上的指紋',desc:'保險箱內鈔票袋的「內側」採到林志明的指紋。',kw:['指紋','手印','鈔票袋','採證'],gain:12,unlock:{count:1},
   react:{low:['我是會計，碰保險箱很正常吧？'],mid:['指紋……那、那是之前月結的時候留下的……'],high:['鈔票袋的內側……我、我……']},
   excuse:['會計','月結','工作','常碰','本來就','點鈔'],hint:'說你是會計，月結點鈔本來就會碰鈔票袋',aiAsk:'鈔票袋的「內側」採到你的指紋。內側喔。'},
  {id:'witness',name:'清潔員王阿姨的證詞',desc:'晚上十點多，看到林志明提著鼓鼓的黑色袋子離開公司。',kw:['證人','阿姨','清潔','目擊','看到你','有人看到','證詞','黑色袋子'],gain:11,unlock:{count:2},
   react:{low:['清潔阿姨？她老眼昏花，看錯了吧。'],mid:['黑色袋子……那、那是我的運動包……'],high:['王阿姨……她真的看到了……']},
   excuse:['運動包','健身','看錯','老眼昏花','不是我'],hint:'說那是你的運動包，阿姨看錯人了',aiAsk:'清潔員王阿姨說，十點多看到你提著鼓鼓的黑色袋子離開。'},
  {id:'debt',name:'錢莊催款簡訊',desc:'林志明手機裡的簡訊：「再不還八十萬，你女兒的學校我們知道在哪。」',kw:['賭','欠債','錢莊','債務','借錢','討債','催款','欠錢','簡訊','還錢'],gain:16,unlock:{count:3},motive:true,
   react:{low:['賭債？你、你在說什麼，我沒有欠錢！'],mid:['你們怎麼會有這個？錢莊的人找過你們？'],high:['他們說再不還錢，就要去我女兒的學校……']},
   excuse:['詐騙','誤會','不是我的','早就還','亂傳'],hint:'說那是詐騙簡訊，你根本沒欠錢',aiAsk:'這是你手機裡的簡訊：「再不還八十萬，你女兒的學校我們知道在哪。」你欠了錢莊的錢？'}
 ],
 leak:[['後車廂',null],['錢莊','debt'],['賭','debt'],['八十萬','debt'],['80萬','debt'],['刷卡','card'],['黑色袋子','witness'],['十點','card']],
 confess:{cry:'嗚……對不起……是我拿的……我欠了錢莊八十萬，他們說要對我女兒下手……錢……錢還藏在我車子的後車廂……',hyst:'啊啊啊——！對！是我拿的！錢就在我車子後車廂！你們滿意了吧！'},
 fail:'我累了。在律師來之前，我一句話都不會再說。',
 ending:{win:'贓款在林志明的汽車後車廂被找到，錢莊集團也因此被一網打盡。',lose:'林志明守口如瓶，被無保請回。三天後，他和那80萬一起消失了。'}
},
{
 id:'c2',title:'夜市攤位縱火案',stars:2,resist:0.9,
 suspect:{name:'黃大雄',age:45,job:'雞排攤老闆',type:'hyst'},
 brief:'11月2日凌晨1點，饒河夜市的「阿美珍珠奶茶」攤位起火，延燒了整排攤位。隔壁雞排攤老闆黃大雄和阿美長期不合。',
 secret:'你氣阿美在網路上抹黑你的雞排，凌晨0點50分去超商買打火機，拿攤位的炸油淋在她的攤位上點火，想給她一點教訓，沒想到燒了一整排。',
 cover:'那晚你12點收攤就回家睡覺，老婆可以作證。',
 coverKw:['十二點','12點','收攤','回家','睡覺','老婆'],coverTime:12,
 open:'幹嘛？我的攤位也被燒了耶！你們不去抓犯人，抓我幹嘛？',
 alibiQ:'11月2日凌晨，你人在哪裡？',
 alibi:{first:'我12點收攤就回家睡覺了，我老婆可以作證！',again:['講幾遍了！12點就回家了！']},
 evidence:[
  {id:'oil',name:'起火點的油桶',desc:'起火點找到燒焦的油桶，桶身印著「大雄雞排」。',kw:['油桶','桶子','炸油','起火點','汽油','油'],gain:10,unlock:'start',
   react:{low:['油桶？我的油桶早就被偷了！'],mid:['那、那是我的桶子沒錯，可是我不知道怎麼會在那裡！'],high:['那個油……那個油……']},
   excuse:['被偷','偷走','借','不見','很多人'],hint:'說你的油桶前幾天就被偷了',aiAsk:'起火點找到一個燒焦的油桶，上面印著「大雄雞排」。你的吧？'},
  {id:'store',name:'超商監視器',desc:'凌晨0:50，黃大雄在夜市旁的超商買了一個打火機。',kw:['超商','便利商店','打火機','買東西','7-11','全家'],gain:12,unlock:'alibi',contra:true,
   react:{low:['買打火機犯法喔？'],mid:['我、我抽菸啦！'],high:['那個打火機……']},contraLine:'我、我是……買打火機抽菸不行喔！我是說……我、我那時候還沒回家啦！',
   excuse:['抽菸','香菸','點菸','菸'],hint:'說你買打火機是為了抽菸',aiAsk:'凌晨0點50分，超商監視器拍到你在買打火機。你不是12點就回家睡了？'},
  {id:'wife',name:'黃太太改口的證詞',desc:'黃太太改口：他那天一點半才回家，身上有很重的煙味。',kw:['老婆','太太','妻子','改口','煙味','一點半'],gain:13,unlock:{count:1},contra:true,
   react:{low:['她亂講！她跟我吵架故意的！'],mid:['她……她真的這樣說？'],high:['連她都不相信我了……']},contraLine:'她、她怎麼……我是說，我、我晚一點回家又怎樣！',
   excuse:['吵架','亂講','記錯','炸雞','油煙'],hint:'說煙味是炸雞排的油煙，她記錯時間',aiAsk:'你太太改口了，她說你一點半才回家，身上一股煙味。'},
  {id:'post',name:'網路吵架截圖',desc:'黃大雄在網路留言回嗆阿美：「抹黑我？走著瞧，讓妳做不了生意。」',kw:['網路','留言','截圖','臉書','走著瞧','吵架','抹黑','生意'],gain:15,unlock:{count:2},motive:true,
   react:{low:['講講氣話而已，犯法喔？'],mid:['她先在網路上抹黑我的！'],high:['她害我生意掉一半……我只是想給她一點教訓……']},
   excuse:['氣話','開玩笑','說說而已','隨便講'],hint:'說那只是一時的氣話',aiAsk:'你在網路上說要讓阿美做不了生意，還說走著瞧？'},
  {id:'cloth',name:'燒焦的外套',desc:'從黃大雄家洗衣籃找到的外套，袖口有燒焦痕跡和炸油。',kw:['衣服','外套','袖子','燒焦','痕跡','洗衣'],gain:12,unlock:{count:3},
   react:{low:['炸雞排本來就會沾到油！'],mid:['袖、袖子那個是……是被油噴到的……'],high:['我想說洗一洗就沒事了……']},
   excuse:['炸雞','工作','噴到','油鍋'],hint:'說是炸雞排時被油鍋噴到',aiAsk:'你家洗衣籃裡的外套，袖口燒焦了，還沾滿炸油。'}
 ],
 leak:[['點火',null],['淋',null],['打火機','store'],['一點半','wife'],['走著瞧','post'],['外套','cloth']],
 confess:{hyst:'對啦！是我燒的！她在網路上害我生意掉一半，我只是想給她一點教訓，我哪知道會燒成這樣……',cry:'對不起……是我燒的……我只是想嚇嚇她……我沒想到會燒掉整排……'},
 fail:'我要找律師！你們沒證據就放我回去做生意！',
 ending:{win:'黃大雄承認縱火，夜市攤商們終於得到交代。',lose:'證據不足，黃大雄回到夜市繼續賣雞排，鄰居們都不敢再靠近他。'}
},
{
 id:'c3',title:'珠寶店鑽石調包案',stars:3,resist:0.8,
 suspect:{name:'蕭天翔',age:29,job:'集團小開',type:'roar'},
 brief:'價值3000萬的藍鑽「海洋之心」，在富二代蕭天翔試戴之後被發現換成了假鑽。他堅稱自己只是試戴，家裡有的是錢。',
 secret:'你家公司快破產，信用卡全被停。你事先用助理的名義訂做假鑽，試戴時趁店員轉身的8秒調包，當天下午把真鑽放進銀行保險箱。',
 cover:'你只是試戴一下就還回去了，之後直接回家。你家有的是錢，根本不需要偷。',
 coverKw:['試戴','還回去','直接回家','有錢','不需要'],coverTime:null,
 open:'找我來做什麼？我很忙，下午還有遊艇派對。',
 alibiQ:'試戴完之後，你去了哪裡？',
 alibi:{first:'試戴完？我就直接回家了。我家有的是錢，需要偷嗎？',again:['我說了，直接回家。']},
 evidence:[
  {id:'cam',name:'店內監視器',desc:'店員轉身拿證書的8秒內，蕭天翔的手被身體擋住，看不到動作。',kw:['監視器','影片','畫面','八秒','8秒','轉身'],gain:9,unlock:'start',
   react:{low:['八秒？八秒能做什麼？'],mid:['你們看不到我的手，就代表我有做什麼？'],high:['那八秒……我只是在欣賞鑽石……']},
   excuse:['欣賞','看鑽石','看不到','沒拍到','什麼都'],hint:'說畫面根本拍不到你的手',aiAsk:'店員轉身的那8秒，你的手被身體擋住了。你在做什麼？'},
  {id:'fake',name:'假鑽鑑定報告',desc:'假鑽是高級人造鋯石，切工和原鑽完全相同，必須事先訂做。',kw:['假鑽','鑑定','鋯石','切工','訂做'],gain:11,unlock:{count:1},
   react:{low:['那代表店家早就被調包了，不關我的事。'],mid:['事、事先訂做？那也可能是別人訂的。'],high:['……']},
   excuse:['店家','早就','別人','之前','店員'],hint:'說假鑽可能在你試戴前就被調包了',aiAsk:'鑑定結果出來了，假鑽的切工跟真鑽一模一樣，這種東西一定要事先訂做。'},
  {id:'bank',name:'銀行保險箱紀錄',desc:'試戴當天下午3點，蕭天翔去了銀行，開啟了自己的保險箱。',kw:['銀行','保險箱','下午'],gain:12,unlock:'alibi',contra:true,
   react:{low:['我去銀行不行嗎？'],mid:['那、那是我的私事。'],high:['……保險箱裡只是文件。']},contraLine:'我、我去銀行拿個文件不行嗎！我是說……回家前順便去的！',
   excuse:['文件','合約','存東西','手錶','順便'],hint:'說你只是順路去銀行拿合約文件',aiAsk:'你說試戴完直接回家？你下午3點去了銀行，還打開了自己的保險箱。'},
  {id:'receipt',name:'地下工坊收據',desc:'一家地下工坊的訂做收據，訂購人是蕭天翔的私人助理。',kw:['收據','工坊','助理','訂購','訂單'],gain:13,unlock:{count:2},
   react:{low:['助理訂的東西關我什麼事？'],mid:['那、那是他自己的私事……'],high:['那個沒用的助理……']},
   excuse:['助理','私事','不知道','他自己'],hint:'把責任推給助理',aiAsk:'訂做假鑽的工坊收據上，訂購人是你的私人助理。'},
  {id:'money',name:'停卡通知與財報',desc:'蕭家公司連續三季虧損，蕭天翔名下五張信用卡全部被停卡。',kw:['停卡','信用卡','財報','破產','虧損','沒錢','公司'],gain:16,unlock:{count:3},motive:true,
   react:{low:['那是暫時的財務調度。'],mid:['你、你們查我的信用卡？'],high:['我爸不讓任何人知道公司快倒了……']},
   excuse:['調度','暫時','誤會','換卡','升級'],hint:'說只是暫時的財務調度',aiAsk:'你名下五張信用卡全部被停卡，你家公司連虧三季。你還說你家有的是錢？'}
 ],
 leak:[['銀行','bank'],['保險箱','bank'],['破產','money'],['助理','receipt'],['鋯石','fake'],['訂做','fake']],
 confess:{roar:'對！是我換的！公司要倒了，我爸只會罵我沒用！鑽石就在我的銀行保險箱裡，你們滿意了吧！',hyst:'夠了！對！是我換的！鑽石在我銀行保險箱裡！'},
 fail:'我的律師到了。下次要問話，先準備好真正的證據。',
 ending:{win:'「海洋之心」在蕭天翔的銀行保險箱被找到，蕭家集團的財務危機也跟著曝光。',lose:'蕭天翔在律師團簇擁下離開，「海洋之心」從此下落不明。'}
},
{
 id:'c4',title:'美術館名畫調包案',stars:4,resist:0.72,
 suspect:{name:'沈靜雯',age:41,job:'資深修復師',type:'mad'},
 brief:'美術館鎮館之作《晨霧》被發現是贗品。修復師沈靜雯負責修復這幅畫長達三個月，她冷靜地否認一切。',
 secret:'館方要裁撤你的修復部門。你在修復期間花三個月臨摹了一幅贗品，畫送回倉庫時調包，把真跡賣給海外收藏家，收了500萬。',
 cover:'修復期間畫一直鎖在恆溫室，有門禁和監視器。真跡一定是在運送時被別人調包的。',
 coverKw:['恆溫室','門禁','監視器','運送','別人'],coverTime:null,
 open:'警官，有話請直說。我下午還要回工作室。',
 alibiQ:'畫送回倉庫那天，你在做什麼？',
 alibi:{first:'那天我在工作室整理文件。畫是運送公司負責的，與我無關。',again:['我說過了，我在工作室。']},
 evidence:[
  {id:'paint',name:'贗品顏料分析',desc:'贗品使用了今年才上市的新型鈦白顏料。',kw:['顏料','鈦白','分析','化驗','成分'],gain:9,unlock:'start',
   react:{low:['任何人都買得到那種顏料。'],mid:['……今年上市，所以呢？'],high:['你們的鑑識組比我想的認真。']},
   excuse:['任何人','買得到','很普遍','誰都'],hint:'說那種顏料任何人都買得到',aiAsk:'贗品用的是今年才上市的鈦白顏料，代表這幅假畫是今年才畫的。'},
  {id:'door',name:'恆溫室門禁紀錄',desc:'修復期間，沈靜雯每晚都加班到凌晨兩三點，是唯一深夜進出的人。',kw:['門禁','加班','深夜','凌晨','恆溫室','進出'],gain:11,unlock:'alibi',contra:true,
   react:{low:['修復需要時間，加班很正常。'],mid:['……你在暗示什麼？'],high:['深夜才安靜，才能好好畫……我是說，好好修。']},contraLine:'……你說得對，畫一直在恆溫室，而深夜只有我在。那又如何？',
   excuse:['加班','修復','趕工','工作','進度'],hint:'說修復進度很趕，所以每晚加班',aiAsk:'你說畫一直鎖在恆溫室？門禁紀錄顯示，你每天深夜都一個人待在裡面到凌晨。'},
  {id:'sketch',name:'工作室的臨摹草稿',desc:'在沈靜雯工作室找到的《晨霧》局部臨摹草稿，筆觸與贗品一致。',kw:['草稿','臨摹','工作室','筆觸','素描'],gain:12,unlock:{count:1},
   react:{low:['修復師都會練習臨摹，這是基本功。'],mid:['筆觸一致？……那說明我臨摹得很好。'],high:['那些草稿……我應該燒掉的。']},
   excuse:['練習','基本功','研究','修復需要'],hint:'說臨摹是修復師的基本功',aiAsk:'你工作室裡的臨摹草稿，筆觸跟贗品完全一致。'},
  {id:'account',name:'海外帳戶入帳',desc:'沈靜雯在海外的帳戶，三週前收到500萬元匯款。',kw:['帳戶','匯款','海外','五百萬','500萬','入帳'],gain:14,unlock:{count:2},
   react:{low:['那是我替私人收藏家修畫的酬勞。'],mid:['你們查到海外去了？'],high:['……那筆錢，是我應得的。']},
   excuse:['酬勞','私人','接案','修畫','顧問'],hint:'說那是私下接案修畫的酬勞',aiAsk:'你的海外帳戶三週前收到500萬，這是什麼錢？'},
  {id:'memo',name:'裁撤部門公文',desc:'館方公文：明年起裁撤修復部門，業務全部外包。',kw:['裁撤','公文','部門','外包','裁員','二十年'],gain:15,unlock:{count:3},motive:true,
   react:{low:['裁撤是館方的決定，與我無關。'],mid:['二十年……我在這裡二十年……'],high:['他們把我的心血當垃圾……那幅畫只有我懂。']},
   excuse:['無所謂','早就知道','退休','沒差'],hint:'表現得毫不在意',aiAsk:'館方明年要裁撤你的部門，你在這裡工作了二十年吧？'},
  {id:'mover',name:'搬運工的證詞',desc:'搬運工作證：畫送回倉庫前，沈靜雯以「最後檢查」為由獨自打開過運送箱。',kw:['搬運','運送箱','箱子','最後檢查','工人'],gain:13,unlock:{count:4},
   react:{low:['那是例行檢查。'],mid:['……他記得真清楚。'],high:['那十分鐘，夠了。']},
   excuse:['檢查','確認','職責','例行'],hint:'說那只是修復師的例行最後檢查',aiAsk:'搬運工說，畫送回倉庫前，你一個人打開過運送箱，說要做最後檢查。'}
 ],
 leak:[['鈦白','paint'],['五百萬','account'],['500萬','account'],['收藏家',null],['海外','account'],['運送箱','mover'],['臨摹','sketch']],
 confess:{mad:'呵呵……對，是我換的。二十年的心血，他們說裁就裁。真跡在一位海外收藏家手上，至少他懂得珍惜。'},
 fail:'時間到了吧，警官。下次見面，記得帶點真正的東西來。',
 ending:{win:'真跡《晨霧》透過國際刑警追回，沈靜雯的臨摹功力讓鑑定專家都驚嘆不已。',lose:'沈靜雯平靜地離開警局。一年後，《晨霧》出現在海外私人收藏展上。'}
},
{
 id:'c5',title:'午夜電台主持人失蹤案',stars:5,resist:0.65,
 suspect:{name:'韓默',age:36,job:'電台製作人',type:'mad'},
 brief:'當紅深夜電台主持人「阿光」直播結束後離奇失蹤三天。最後和他在一起的是製作人韓默。外界傳聞阿光欠債躲起來了。',
 secret:'電台收聽率下滑即將停播。你策劃「主持人離奇失蹤」來炒話題，讓阿光喝下加了安眠藥的咖啡，凌晨開車載他到陽明山的小木屋鎖起來，打算一週後安排「奇蹟生還」直播。',
 cover:'直播一點結束後，你和阿光在門口分開，各自開車回家。他欠債的傳聞大家都知道。',
 coverKw:['一點','1點','分開','各自','開車回家','欠債'],coverTime:1,
 open:'我也很擔心阿光。你們應該去查他的債主，而不是我。',
 alibiQ:'直播結束後，你和阿光去了哪裡？',
 alibi:{first:'直播一點結束，我們在門口分開，各自開車回家。你們應該去查他的債務。',again:['我說過了，各自回家。']},
 evidence:[
  {id:'parking',name:'停車場監視器',desc:'電台停車場監視器：阿光的車整晚都停在原地，沒有開走。',kw:['停車場','他的車','停車','沒開走','監視器'],gain:9,unlock:'alibi',contra:true,
   react:{low:['也許他叫了計程車。'],mid:['……他可能臨時改變主意。'],high:['那台車……我忘了處理。']},contraLine:'……也許他後來叫了計程車。我只是說「各自回家」，沒說他開車。',
   excuse:['計程車','朋友載','改變主意','叫車'],hint:'說阿光可能叫了計程車',aiAsk:'你說你們各自開車回家？阿光的車整晚都停在停車場，根本沒開走。'},
  {id:'rumor',name:'債務傳聞查證',desc:'查證結果：阿光的債務半年前就還清了，欠債傳聞是匿名帳號散布的。',kw:['欠債','債務','傳聞','謠言','匿名','債主'],gain:8,unlock:'start',
   react:{low:['匿名帳號？網路上什麼人都有。'],mid:['……還清了？我不知道。'],high:['那些帳號……']},
   excuse:['不知道','網路','謠言','不清楚'],hint:'說你不知道網路謠言是從哪來的',aiAsk:'阿光的債半年前就還清了，欠債傳聞是匿名帳號散布的。你知道是誰嗎？'},
  {id:'phone',name:'手機最後訊號',desc:'阿光手機的最後訊號，出現在凌晨2點的陽明山區。',kw:['手機','訊號','基地台','陽明山','山上'],gain:11,unlock:{count:1},
   react:{low:['也許他自己去山上散心。'],mid:['陽明山……那又怎樣？'],high:['……']},
   excuse:['散心','自己去','不知道','他自己'],hint:'說阿光可能自己上山散心',aiAsk:'阿光手機最後的訊號，凌晨2點出現在陽明山。'},
  {id:'etc',name:'韓默的行車紀錄',desc:'韓默的車凌晨1點40分往陽明山方向行駛，4點才回到市區。',kw:['行車','電子收費','紀錄','你的車','eTag','ETC','etc','收費站'],gain:13,unlock:{count:2},contra:true,
   react:{low:['我去兜風不行嗎？'],mid:['……你們連這個都查了。'],high:['……']},contraLine:'我……我是去山上兜風，睡不著。這跟阿光無關。',
   excuse:['兜風','睡不著','散心','看夜景'],hint:'說你睡不著，去山上兜風看夜景',aiAsk:'你說各自回家？你的車凌晨1點40分往陽明山去，4點才回到市區。'},
  {id:'pills',name:'安眠藥處方',desc:'阿光失蹤前一天，韓默領了一整盒安眠藥，但他的家人說他從不失眠。',kw:['安眠藥','藥','處方','藥局','失眠'],gain:12,unlock:{count:3},
   react:{low:['我最近壓力大，睡不好。'],mid:['你們連我的病歷都查？'],high:['那些藥……只是讓他好好睡一覺……']},
   excuse:['失眠','壓力','睡不好','醫生'],hint:'說你最近壓力大、失眠',aiAsk:'阿光失蹤前一天，你領了一整盒安眠藥。你家人說你從來不失眠。'},
  {id:'memo',name:'停播公文',desc:'電台內部公文：節目收聽率連續下滑，下個月起停播。',kw:['停播','收聽率','公文','節目','下滑'],gain:13,unlock:{count:3},motive:true,
   react:{low:['節目起起落落很正常。'],mid:['停播……你們從哪拿到的？'],high:['十年的節目，就要這樣結束……']},
   excuse:['正常','早就知道','無所謂','沒差'],hint:'表現得不在乎停播',aiAsk:'你的節目下個月就要停播了，收聽率連續下滑，對吧？'},
  {id:'plan',name:'失蹤企劃書',desc:'韓默電腦裡的檔案《失蹤話題七日計畫》：第七天安排「奇蹟生還」直播。',kw:['企劃','計畫','七日','電腦','檔案','奇蹟生還','炒作'],gain:18,unlock:{count:4},
   react:{low:['那只是劇本構想。'],mid:['你們……打開了我的電腦？'],high:['只差四天……只要再四天……']},
   excuse:['劇本','構想','創作','小說','點子'],hint:'說那只是你寫的劇本構想',aiAsk:'你電腦裡有一份《失蹤話題七日計畫》，第七天要安排「奇蹟生還」直播？'}
 ],
 leak:[['小木屋',null],['咖啡',null],['安眠藥','pills'],['陽明山','phone'],['七日','plan'],['停播','memo'],['匿名','rumor']],
 confess:{mad:'呵……只差四天。阿光在陽明山我家的小木屋，他很安全，有吃有喝。我只是想救這個節目……收聽率會破紀錄的……'},
 fail:'時間到了。你們找不到他，也證明不了任何事。',
 ending:{win:'警方在陽明山小木屋找到阿光，他平安無事。「奇蹟生還」真的上了頭條，只是主角換成了韓默。',lose:'韓默離開警局後，第七天，阿光「奇蹟生還」的直播創下了收聽紀錄。'}
}
];
const byId=id=>CASES.find(c=>c.id===id)||CASES[0];

/* ---------- 遊戲狀態 ---------- */
function newGame(caseId,limit){
 const C=byId(caseId);
 const st={caseId:C.id,limit:limit||20,rounds:limit||20,turn:0,P:5,mood:10,used:{},alibiHeard:false,contraFound:[],threatN:0,empathyN:0,bluffN:0,flatterN:0,insultN:0,overN:0,
  stall:0,danger:0,unlocked:[],end:null,breakMode:C.suspect.type,claimTime:null,leaks:0,selfContra:0,lawyerN:0,silentN:0,excuseN:0,lastEvid:null,pendingContra:null,askedTactic:{},log:[]};
 refreshUnlock(st);
 return st;
}
function usedCount(st){return Object.keys(st.used).filter(k=>st.used[k]).length;}
function isUnlocked(st,e){
 if(e.unlock==='start') return true;
 if(e.unlock==='alibi') return st.alibiHeard||usedCount(st)>=2;
 return usedCount(st)>=e.unlock.count;
}
function refreshUnlock(st){
 const C=byId(st.caseId), now=[];
 for(const e of C.evidence) if(!st.unlocked.includes(e.id)&&isUnlocked(st,e)){st.unlocked.push(e.id);now.push(e);}
 return now;
}
const bandOf=P=>P<30?'low':P<60?'mid':'high';

/* 解析一句審問（人類或 AI 都用這個） */
function parseQuestion(st,text,evidId){
 const C=byId(st.caseId), s=norm(text);
 const hits=[];
 if(evidId&&st.unlocked.includes(evidId)) hits.push(evidId);
 if(s) for(const e of C.evidence) if(st.unlocked.includes(e.id)&&!hits.includes(e.id)&&has(s,e.kw)) hits.push(e.id);
 const intents={};
 for(const k in KW) if(s&&has(s,KW[k])) intents[k]=true;
 const locked=s?C.evidence.filter(e=>!st.unlocked.includes(e.id)&&has(s,e.kw)).map(e=>e.id):[];
 const display=text&&text.trim()?text.trim():(evidId?'（出示證物：'+(C.evidence.find(e=>e.id===evidId)||{}).name+'）':'……');
 return {text:display,evidId:evidId||null,hits:hits.slice(0,2),intents,locked};
}

/* AI 審問官挑下一個問題 */
function aiQuestion(st){
 const C=byId(st.caseId), per=PERS[C.suspect.type];
 if(st.turn===0&&!st.alibiHeard) return Object.assign(parseQuestion(st,'',null),{text:pick(INTER.open)+C.alibiQ,intents:{alibi:true},ai:true});
 if(!st.alibiHeard) return {text:C.alibiQ,evidId:null,hits:[],intents:{alibi:true},ai:true};
 if(st.pendingContra){const p=st.pendingContra; st.pendingContra=null; return {text:INTER.contraQ.replace('{a}',p.a).replace('{b}',p.b),evidId:null,hits:[],intents:{},press:6,ai:true};}
 const avail=C.evidence.filter(e=>st.unlocked.includes(e.id)&&!st.used[e.id]);
 const e=avail.find(x=>x.contra)||avail[0];
 if(e) return {text:e.aiAsk,evidId:e.id,hits:[e.id],intents:{},ai:true};
 if(st.P>=55&&st.empathyN<2) return {text:pick(INTER.empathy),evidId:null,hits:[],intents:{empathy:true},ai:true};
 if(st.P>=35&&st.bluffN<1) return {text:pick(INTER.bluff),evidId:null,hits:[],intents:{bluff:true},ai:true};
 if(st.threatN<per.overAt-1) return {text:pick(INTER.threat),evidId:null,hits:[],intents:{threat:true},ai:true};
 return {text:pick(INTER.press),evidId:null,hits:[],intents:{},press:4,ai:true};
}

const CN={'零':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
function parseTime(s){
 const m=s.match(/([0-9０-９]{1,2}|[一二兩三四五六七八九十]{1,3})(點|時)/);
 if(!m) return null;
 let v=m[1].replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0));
 if(/^\d+$/.test(v)) return +v;
 if(v==='十') return 10; if(v.startsWith('十')) return 10+(CN[v[1]]||0); if(v.endsWith('十')) return (CN[v[0]]||1)*10;
 if(v.length===3&&v[1]==='十') return CN[v[0]]*10+CN[v[2]];
 return CN[v]!=null?CN[v]:null;
}

/* 人類嫌犯的回答：判斷藉口好壞、前後矛盾、說溜嘴 */
function evalAnswer(st,q,text){
 const C=byId(st.caseId), s=norm(text), notes=[]; let mul=1, add=0, flags={};
 if(CONFESS.test(s)) return {mul:1,add:100,notes:['嫌犯自己認罪了！'],flags:{confess:true}};
 const ev=q.hits.length?C.evidence.find(e=>e.id===q.hits[0]):null;
 if(s.length<3){mul=1.15;add+=3;st.silentN++;notes.push('沉默只會更可疑');flags.silent=true;}
 else if(ev&&has(s,ev.excuse)){mul=0.35;st.excuseN++;notes.push('合理的解釋，壓力大減');flags.excuse=true;}
 else if(q.intents.alibi&&has(s,C.coverKw)){mul=0.3;notes.push('說詞和事前準備的一致');flags.excuse=true;}
 else if(ev){mul=0.9;notes.push('解釋得不太有說服力');flags.weak=true;}
 else if(q.intents.threat&&/(律師|證據|冤枉|沒做|不是我)/.test(s)){mul=0.55;notes.push('冷靜應對了威脅');flags.excuse=true;}
 else if((q.intents.empathy||q.intents.bluff)&&/(沒做|不是我|冤枉|證據|唬)/.test(s)){mul=0.6;notes.push('沒有被套話');flags.excuse=true;}
 else mul=0.8;
 if(s.includes('律師')){st.lawyerN++; if(st.lawyerN===1){mul*=0.5;notes.push('要求律師，暫時穩住');flags.lawyer=true;} else {add+=3;notes.push('一直喊律師反而顯得心虛');}}
 const tm=parseTime(s);
 if(tm!=null){
  if(st.claimTime==null){st.claimTime=tm; if(C.coverTime!=null&&tm!==C.coverTime){add+=6;notes.push('說出的時間和事前說詞不同');flags.contra=true;}}
  else if(tm!==st.claimTime){add+=15;st.selfContra++;notes.push('前後矛盾！你剛才說的是'+st.claimTime+'點');flags.contra=true;st.pendingContra={a:tm,b:st.claimTime};}
 }
 for(const [w,eid] of C.leak){ if(s.includes(w)&&(!eid||!st.used[eid])){add+=14;st.leaks++;notes.push('說溜嘴了：「'+w+'」');flags.leak=true;break;} }
 if(s.length>45){add+=3;notes.push('說太多了，破綻跟著變多');}
 if(has(s,KW.insult)){add+=2;notes.push('對警官不禮貌，態度扣分');}
 return {mul,add,notes,flags};
}

/* 結算一回合。answerText 為 null 時由 AI 扮演嫌犯 */
function resolve(st,q,answerText){
 const C=byId(st.caseId), per=PERS[C.suspect.type], bank=BANK[C.suspect.type], b=bandOf(st.P);
 let gain=0, reply=null; const notes=[];
 for(const id of q.hits){
  const e=C.evidence.find(x=>x.id===id), n=st.used[id]||0; st.used[id]=n+1; st.lastEvid=id;
  if(n===0){
   let g=e.gain;
   if(e.contra&&st.alibiHeard){g+=Math.round(10*per.contra);st.contraFound.push(id);notes.push('戳破嫌犯的說詞！');reply=reply||e.contraLine||pick(e.react[b]);}
   if(e.motive) notes.push('找到犯案動機！');
   gain+=g; reply=reply||pick(e.react[b]);
  } else { if(n===1) gain+=Math.round(e.gain*0.3); reply=reply||pick(bank.repeat); notes.push('重複出示，效果大減'); }
 }
 const it=q.intents;
 if(!q.hits.length&&it.alibi){
  if(!st.alibiHeard){st.alibiHeard=true;gain+=3;reply=C.alibi.first;notes.push('取得嫌犯的說詞');}
  else {gain+=1;reply=pick(C.alibi.again);}
 }
 if(it.insult){gain-=4;st.insultN++;reply=reply||pick(bank.insult);notes.push('態度太差，嫌犯開始防備');}
 if(it.threat){st.threatN++;
  if(st.threatN>=per.overAt){gain-=4;st.overN++;reply=reply||pick(bank.threat.over);notes.push('威脅太多次，反而失效');}
  else {gain+=Math.round((b==='high'?8:6)*per.threat);reply=reply||pick(bank.threat[b]);}}
 if(it.empathy){st.empathyN++;gain+=Math.round((b==='low'?2:b==='mid'?7:13)*per.empathy);reply=reply||pick(bank.empathy[b]);if(b==='high'&&per.empathy>=1)notes.push('動之以情，正中要害');}
 if(it.bluff){st.bluffN++;
  if(st.P<35){gain-=3;reply=reply||pick(bank.bluff.fail);notes.push('嫌犯看穿你在虛張聲勢');}
  else {gain+=Math.round((st.bluffN===1?9:2)*per.bluff);reply=reply||pick(bank.bluff.ok);}}
 if(it.flatter){st.flatterN++; const g=st.flatterN<=2?Math.round(4*per.flatter):0; gain+=g; reply=reply||pick(bank.flatter[b]); if(per.flatter>1&&st.flatterN<=2) notes.push('他被捧得飄飄然，開始鬆口');}
 if(q.press){gain+=q.press;reply=reply||pick(bank.other[b]);}
 if(reply==null){gain+=1;reply=pick(bank.other[b]);}
 if(q.locked&&q.locked.length&&!q.hits.length) notes.push('你提到的證據還沒到手，嫌犯根本不怕。先繼續問，取得更多證物。');
 if(gain>0) gain=Math.max(1,Math.round(gain*C.resist));

 let flags={}, interLine=null;
 if(answerText!=null){
  const a=evalAnswer(st,q,answerText); flags=a.flags;
  gain=Math.round(Math.max(0,gain)*a.mul)+a.add+(gain<0?gain:0);
  if(flags.excuse&&!q.hits.length&&!flags.contra&&!flags.leak&&!flags.confess){gain=Math.min(gain,st.P>=60?-5:-3);a.notes.push('穩住了情緒，壓力下降');}
  notes.push(...a.notes);
  reply=answerText.trim()||'……';
 }
 gain=Math.round(gain);
 st.P=clamp(st.P+gain,0,100); st.rounds--; st.turn++;
 st.stall=gain<=2?st.stall+1:0;
 st.danger=gain>=8?st.danger+1:0;
 st.mood=clamp(st.mood+(gain>=8?-8:gain<=2?14:2)+(flags.excuse?6:0)+(it.insult?-2:0)+(flags.contra||flags.leak?-10:0),0,100);
 const unlockedNow=refreshUnlock(st);
 if(flags.contra) interLine=pick(INTER.react.contra);
 else if(flags.leak) interLine=pick(INTER.react.leak);
 else if(flags.silent) interLine=pick(INTER.react.silent);
 else if(flags.lawyer) interLine=pick(INTER.react.lawyer);
 else if(flags.excuse) interLine=pick(INTER.react.excuse);
 else if(gain>=10) interLine=pick(INTER.react.weak);
 else interLine=pick(INTER.react.calm);
 let confession=null;
 if(flags.confess||st.P>=90){
  st.end='broke';
  st.breakMode=(C.suspect.type==='cry'&&st.threatN>st.empathyN+1&&C.confess.hyst)?'hyst':C.suspect.type;
  st.P=100; confession=C.confess[st.breakMode]||Object.values(C.confess)[0];
  if(answerText==null) reply=confession;
  interLine=pick(INTER.react.broke);
 } else if(st.rounds<=0){
  st.end='held'; interLine=pick(INTER.react.held);
 }
 const res={q:q.text,gain,reply,notes,unlocked:unlockedNow.map(e=>e.id),end:st.end,confession,interLine,flags};
 st.log.push({q:q.text,a:reply,gain});
 if(st.log.length>60) st.log.shift();
 return res;
}

/* ---------- 建議下一步（連續兩回合沒進展才出現） ---------- */
function hints(st,role){
 const C=byId(st.caseId), per=C.suspect.type;
 if(st.end) return [];
 const h=[];
 if(role==='inter'){
  if(st.stall<2) return [];
  if(!st.alibiHeard) h.push('先問他案發時人在哪裡（例如：「那天晚上你在哪裡？」），取得他的說詞。');
  const av=C.evidence.filter(e=>st.unlocked.includes(e.id)&&!st.used[e.id]);
  const contra=av.find(e=>e.contra);
  if(st.alibiHeard&&contra) h.push('他的說詞有破綻！出示「'+contra.name+'」戳破他。');
  const mot=av.find(e=>e.motive); if(mot) h.push('「'+mot.name+'」可能就是他的犯案動機。');
  const rest=av.filter(e=>e!==contra&&e!==mot);
  if(rest.length&&h.length<2) h.push('還沒用過的證物：'+rest.map(e=>'「'+e.name+'」').join('、')+'。');
  if(per==='roar') h.push('他很自大，試著稱讚他、捧他，他可能會鬆口。');
  else if(per==='mad') h.push('他很冷靜，威脅沒有用，要用證據和矛盾一步步逼他。');
  else if(st.P>=55) h.push('他快撐不住了。提到他的家人、勸他自首從輕，效果會特別好。');
  if(!av.length) h.push('證物都用完了，換個戰術：動之以情、虛張聲勢，或再問一次他的說詞。');
 } else {
  if(st.danger<2) return [];
  h.push('危險！你的壓力連續上升了。');
  const e=st.lastEvid&&C.evidence.find(x=>x.id===st.lastEvid);
  if(e) h.push('面對「'+e.name+'」，可以這樣解釋：'+e.hint+'。');
  h.push('說話前後要一致，別改口時間和地點：'+C.cover);
  h.push('回答簡短一點，也別提到還沒被拿出來的細節，免得說溜嘴。');
 }
 return h.slice(0,3);
}

/* ---------- 評分與稱號 ---------- */
const TIER_MUL={10:1.1,20:1,30:0.9};
const POLICE=[[95,'刑事警察局局長'],[88,'刑警大隊長'],[80,'偵查隊長'],[72,'分隊長'],[64,'小隊長'],[55,'偵查佐'],[45,'警員'],[0,'實習警員']];
const LEGAL=[[90,'無罪釋放'],[75,'罪證不足，不起訴'],[60,'交保候傳'],[45,'限制出境'],[30,'羈押禁見'],[0,'當庭認罪']];
function score(st,role){
 const C=byId(st.caseId), used=st.limit-st.rounds, total=C.evidence.length, contraTotal=C.evidence.filter(e=>e.contra).length;
 const mul=TIER_MUL[st.limit]||1;
 if(role==='inter'){
  const win=st.end==='broke';
  const eff=win?30*clamp(1-(used-4)/Math.max(1,st.limit-4)*0.9,0,1):0;
  const evd=25*Math.min(1,usedCount(st)/total);
  const con=20*(contraTotal?Math.min(1,st.contraFound.length/contraTotal):1);
  const mot=C.evidence.some(e=>e.motive&&st.used[e.id])?10:0;
  const sty=Math.max(0,15-st.insultN*5-st.overN*3-Math.max(0,st.stall-2)*2);
  let total100=Math.round((eff+evd+con+mot+sty)*mul);
  if(!win) total100=Math.min(44,Math.round(total100*0.55));
  total100=clamp(total100,0,100);
  return {total:total100,win,title:(POLICE.find(p=>total100>=p[0])||POLICE[POLICE.length-1])[1],
   parts:[['破案效率',Math.round(eff),30],['證物運用',Math.round(evd),25],['戳破說詞',Math.round(con),20],['找出動機',mot,10],['審訊風度',sty,15]],mul};
 }
 const win=st.end!=='broke';
 const surv=win?40:30*clamp(used/st.limit,0,1);
 const calm=30*clamp(1-st.P/90,0,1);
 const cons=Math.max(0,20-st.selfContra*10);
 const lips=Math.max(0,10-st.leaks*5);
 let total100=Math.round((surv+calm+cons+lips)*(win?mul:1));
 if(!win) total100=Math.min(29,total100);
 total100=clamp(total100,0,100);
 return {total:total100,win,title:(LEGAL.find(p=>total100>=p[0])||LEGAL[LEGAL.length-1])[1],
  parts:[['撐過審訊',Math.round(surv),40],['保持冷靜',Math.round(calm),30],['口供一致',cons,20],['守口如瓶',lips,10]],mul};
}

root.Engine={CASES,PERS,byId,newGame,parseQuestion,aiQuestion,resolve,hints,score,norm,bandOf,TIER_MUL};
if(typeof module!=='undefined') module.exports=root.Engine;
})(typeof window!=='undefined'?window:globalThis);
