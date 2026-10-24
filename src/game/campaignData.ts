import type {MapDef} from './data';
export const journeyMaps=['airport','baggage','cabin','cloud','oslo','fjord','office','boardroom'] as const;
export type JourneyMap=typeof journeyMaps[number];
export const isJourneyMap=(id:string):id is JourneyMap=>(journeyMaps as readonly string[]).includes(id);
export interface Quest {id:string;name:string;map:JourneyMap;x:number;y:number;texture:string;lines:string[];choices:string[];answer:number;requires?:string[]}
export interface Chapter {id:string;title:string;field:JourneyMap;dungeon:JourneyMap;level:number;color:number;texture:string;mid:string;boss:string;quests:Quest[];arrival:string[];farewell:string[]}
export const chapters:Chapter[]=[
 {id:'haneda',title:'第2章 羽田空港・なくした旅のしおり',field:'airport',dungeon:'baggage',level:3,color:0x93b6bc,texture:'bear',mid:'airportMid',boss:'airportBoss',arrival:['羽田空港。パパへ続く空が、すぐそこにある。','グアムバード：飛べるけど、四人分の航空券は運べないよ！','係員：搭乗案内と、迷子の荷物を手伝ってくれませんか？'],farewell:['係員：搭乗券と保冷ケースをどうぞ。','R太郎：海鮮丼もパスポートがほしいって顔してる！'] ,quests:[
 {id:'gate',name:'搭乗案内係',map:'airport',x:260,y:290,texture:'fishmonger',lines:['オスロ便の掲示は「北の翼」。南は国内線です。','北の翼へ行くには、どの色の案内板を追う？ 青は国際線、赤は国内線。'],choices:['青い国際線の案内','赤い国内線の案内','海鮮丼の匂い'],answer:0},
 {id:'child',name:'迷子の少年',map:'airport',x:490,y:290,texture:'rintaro',lines:['ママは「青いクジラの時計の下で待つ」と言っていたよ。','人混みを探し回るより、どうすればいい？'],choices:['一人で出発させる','案内係と時計で待つ','手荷物になって隠れる'],answer:1},
 {id:'case',name:'保冷ケース職人',map:'airport',x:720,y:290,texture:'merchant',lines:['海鮮丼を守るには、冷気を逃がさない工夫が必要だ。','保冷材は上、すき間はタオルで埋める。このあと何を確認する？'],choices:['ふたの密閉','丼を逆さに振る','温風を当てる'],answer:0},
 {id:'tag',name:'荷札の仕分け盤',map:'baggage',x:260,y:290,texture:'chest',requires:['gate'],lines:['荷札：行先OSL、荷主PAPA。','HNDは羽田、OSLはオスロ、NRTは成田。どのベルトに流す？'],choices:['NRT','OSL','HND'],answer:1},
 {id:'belt',name:'ベルト制御盤',map:'baggage',x:500,y:290,texture:'bell',requires:['tag'],lines:['赤は停止、青は検査、緑は搬送。安全の順は停止→検査→搬送。','最初に押す色は？'],choices:['緑','青','赤'],answer:2},
 {id:'seal',name:'検査担当',map:'baggage',x:720,y:290,texture:'old',requires:['belt'],lines:['検査は終わった。最後に保冷ケースを閉じよう。','航空券、パスポート、保冷ケース。忘れ物は？'],choices:['全部そろった！','パパをここに呼ぶ','丼を預けず走って渡航'],answer:0},
 ]},
 {id:'sky',title:'第3章 空の冒険・雲に落とした約束',field:'cabin',dungeon:'cloud',level:5,color:0xa5c6e0,texture:'owl',mid:'skyMid',boss:'skyBoss',arrival:['窓の向こうは、わたあめみたいな雲。','マーモット：食べる前に、まず着陸しようね。','機長：雲の道が風で乱れています。乗客と空の仲間を助けて！'],farewell:['機長：航路回復。ノルウェーへ降下します。','シンガポール太郎：赤いマフラーも、シートベルト着用だ。'],quests:[
 {id:'seat',name:'客室乗務員',map:'cabin',x:260,y:290,texture:'mom',lines:['揺れるときは座ってベルト。熱い飲み物は置いてね。','まず助ける乗客の行動は？'],choices:['通路でジャンプ','ベルトを締める','窓を開ける'],answer:1},
 {id:'meal',name:'腹ぺこ乗客',map:'cabin',x:490,y:290,texture:'old',lines:['お腹が鳴るけど、その丼はパパのものだよね。','配達の丼を守りながらどうする？'],choices:['機内食を頼む','伝説の丼を食べる','空腹を叱る'],answer:0},
 {id:'radio',name:'通信担当',map:'cabin',x:720,y:290,texture:'merchant',lines:['救難信号は短い音3、長い音3、短い音3。','伝える内容は「現在位置、人数、状況」。どれを先に伝える？'],choices:['今日のおやつ','現在位置と救援要請','好きなゲーム'],answer:1},
 {id:'wind',name:'風向きの旗',map:'cloud',x:260,y:290,texture:'bell',requires:['radio'],lines:['東風は東から吹く風。雲の港は西側。','風に乗るなら、どちらへ？'],choices:['西','東','真下'],answer:0},
 {id:'kite',name:'ひっかかった凧',map:'cloud',x:500,y:290,texture:'fugu',requires:['wind'],lines:['凧の糸が翼に絡んでいる。力任せは危ない。','グアムバード：風を弱めて、糸をほどこう！'],choices:['引きちぎる','風を待ってほどく','丼で叩く'],answer:1},
 {id:'beacon',name:'雲の灯台',map:'cloud',x:720,y:290,texture:'bell',requires:['kite'],lines:['灯台の光は青→白→金。青は海、白は雪、金は街。','着陸先の街を示す光は？'],choices:['青','金','白'],answer:1},
 ]},
 {id:'norway',title:'第4章 オスロ・雪どけの配達便',field:'oslo',dungeon:'fjord',level:7,color:0xb4cfcf,texture:'panda',mid:'osloMid',boss:'osloBoss',arrival:['オスロ。冷たい空気と、温かいパンの匂い。','パパ：会議が終わらない……でも、会いたいよ。','R太郎：待ってて。ここからは、ぼくらの足で。'],farewell:['渡し守：パパの会社は、あの灯りのビルだよ。','マーモット：寒い町にも、あったかい人がいっぱいいたね。'],quests:[
 {id:'hello',name:'街の案内人',map:'oslo',x:260,y:290,texture:'old',lines:['Heiはこんにちは、Takkはありがとう。','助けてくれた人へ、何と言おう？'],choices:['Takk！','会議は延長！','丼は飲み物！'],answer:0},
 {id:'bread',name:'パン屋さん',map:'oslo',x:490,y:290,texture:'mom',lines:['寒さには温かいスープと、乾いた手袋。','濡れた手袋で進むより、まず何をする？'],choices:['雪で洗う','乾かして着替える','我慢して走る'],answer:1},
 {id:'map',name:'路線図の前の人',map:'oslo',x:720,y:290,texture:'merchant',lines:['会社へは港の渡し船。山のバスは反対だよ。','地図の錨マークはどこを示す？'],choices:['山頂','空港','港'],answer:2},
 {id:'ice',name:'氷の見張り',map:'fjord',x:260,y:290,texture:'old',requires:['map'],lines:['氷の上の近道は危険。青い杭は安全な遊歩道。','渡し場へはどちらを通る？'],choices:['青い杭の道','氷の真ん中','泳ぐ'],answer:0},
 {id:'rope',name:'船のロープ',map:'fjord',x:500,y:290,texture:'chest',requires:['ice'],lines:['船を出す準備。乗客の確認→荷物固定→ロープを外す。','荷物固定の前にすることは？'],choices:['ロープを外す','乗客を確認する','船を投げる'],answer:1},
 {id:'warm',name:'渡し守',map:'fjord',x:720,y:290,texture:'fishmonger',requires:['rope'],lines:['最後に温かい灯りをつけて、帰る道を示そう。','パパが家族に帰るために必要なのは？'],choices:['終わらない会議','休んでいいという言葉','もっと仕事'],answer:1},
 ]},
 {id:'company',title:'最終章 パパの会社・おかえりの時間',field:'office',dungeon:'boardroom',level:9,color:0xa4b8c2,texture:'hedgehog',mid:'officeMid',boss:'dad',arrival:['会社の窓だけ、まだ明るい。時計は何周したのだろう。','同僚：パパは「仕事オバケ」に取り憑かれているんだ。','R太郎：仕事をやっつけるんじゃない。パパを迎えに来たんだ。'],farewell:['R太郎：パパ、おつかれさま。海鮮丼、届けに来たよ。','パパ：会議の資料より……ずっと、いい匂いだ。','マーモット：まず深呼吸。そして、ひとくち！'],quests:[
 {id:'coworker',name:'同僚さん',map:'office',x:260,y:290,texture:'merchant',lines:['全部一人で抱えたら、いつまでも帰れない。','明日の仕事をどう分けよう？'],choices:['みんなで担当を分ける','パパに全部渡す','資料を隠す'],answer:0},
 {id:'canteen',name:'社員食堂の人',map:'office',x:490,y:290,texture:'fishmonger',lines:['食事を抜くと、心もお腹も空っぽになるよ。','休憩のために必要なことは？'],choices:['休む予定を決める','立ったまま会議','さらにコーヒー'],answer:0},
 {id:'clock',name:'退勤時計',map:'office',x:720,y:290,texture:'bell',lines:['時計：明日できる仕事と、今しかできない約束がある。','パパに伝える言葉を選ぼう。'],choices:['まだ終わらないの？','一緒にご飯を食べよう','仕事だけしていて'],answer:1},
 {id:'agenda',name:'会議の議事録',map:'boardroom',x:260,y:290,texture:'chest',requires:['coworker'],lines:['議題が増え続ける会議。結論・担当・期限を決めれば終われる。','まず何を確かめよう？'],choices:['今日決めること','来年の全仕事','新しい会議の日'],answer:0},
 {id:'handover',name:'引き継ぎ担当',map:'boardroom',x:500,y:290,texture:'old',requires:['agenda'],lines:['同僚：残りは引き受ける。パパを頼んだ。','任せるために渡すものは？'],choices:['無言の圧力','作業状況と次の手順','伝説の海鮮丼'],answer:1},
 {id:'promise',name:'パパの机の写真',map:'boardroom',x:720,y:290,texture:'bell',requires:['handover'],lines:['机にはR太郎が描いた家族の絵。裏に「いっしょにごはん」とある。','いま、パパに届けたいものは？'],choices:['新しい締め切り','海鮮丼と、おかえりの約束','残業の表彰状'],answer:1},
 ]},
];
export const chapterFor=(map:string):Chapter|undefined=>chapters.find(c=>c.field===map||c.dungeon===map);
export const campaignMaps=Object.fromEntries(chapters.flatMap((c):[JourneyMap,MapDef][]=>[[c.field,{name:c.title.split('・')[0],subtitle:c.arrival[0],color:c.color,path:0xc9c9bc,people:[],buildings:[]}],[c.dungeon,{name:c.dungeon==='baggage'?'手荷物ベルトの迷宮':c.dungeon==='cloud'?'雲の航路':c.dungeon==='fjord'?'フィヨルドの渡し場':'終わらない会議室',subtitle:c.title,color:c.color,path:0xc9c9bc,people:[],buildings:[]}]])) as Record<JourneyMap,MapDef>;
export const campaignIds=['airport0','airport1','airport2','airportMid','airportBoss','sky0','sky1','sky2','skyMid','skyBoss','oslo0','oslo1','oslo2','osloMid','osloBoss','office0','office1','office2','officeMid','dad'] as const;
export type CampaignEnemyId=typeof campaignIds[number];
export const campaignEnemyNames=Object.fromEntries(campaignIds.map((id,i)=>[id,{name:([['迷子の荷札','暴走カート','検査スタンプ','ベルト番長','搭乗ゲートの番人'],['雲のわたぼうし','乱気流フクロウ','雷雲ペンギン','航路のいたずら風','嵐のキャプテン'],['雪だるまパンダ','氷のカメ','雪原のキツネ','凍った錨の精','フィヨルドの守り手'],['書類の山','会議のハリネズミ','締め切りアライグマ','議事録の番人','仕事に取り憑かれたパパ']][Math.floor(i/5)])[i%5],texture:(['bear','cat','hedgehog','rabbit','bear','sheep','owl','penguin','frog','owl','panda','turtle','fox','seal','panda','raccoon','hedgehog','redPanda','otter','dad'])[i]}])) as Record<CampaignEnemyId,{name:string;texture:string}>;
