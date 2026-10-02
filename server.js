const express=require("express"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const app=express(),PORT=process.env.PORT||3000,DB=path.join(__dirname,"data.json");
app.use(express.json({limit:"2mb"}));app.use(express.static(__dirname));
const defaultData={
settings:{cafeName:"Craving Bite Cafe",tagline:"Big flavor. Zero compromise.",location:"Mansehra",whatsapp:"923001234567",phone:"0300-1234567",deliveryFee:100,bankName:"",accountTitle:"",accountNumber:"",iban:"",opening:"11:00 AM",closing:"11:00 PM",about:"Fresh burgers, shawarma, fries & drinks.",banner:"Fresh • Hot • Cravable"},
menu:[
{id:1,cat:"Burgers",name:"Zinger Burger",price:420,emoji:"🍔",desc:"Crispy chicken, lettuce & signature sauce.",available:true,best:true},
{id:2,cat:"Burgers",name:"Classic Chicken Burger",price:350,emoji:"🍔",desc:"Juicy chicken patty with fresh toppings.",available:true,best:false},
{id:3,cat:"Burgers",name:"Double Zinger",price:620,emoji:"🍔",desc:"Double crispy chicken with extra cheese.",available:true,best:true},
{id:4,cat:"Shawarma",name:"Chicken Shawarma",price:300,emoji:"🌯",desc:"Tender chicken, veggies & creamy sauce.",available:true,best:true},
{id:5,cat:"Shawarma",name:"Cheese Shawarma",price:360,emoji:"🌯",desc:"Loaded shawarma with melted cheese.",available:true,best:false},
{id:6,cat:"Fries",name:"Regular Fries",price:180,emoji:"🍟",desc:"Golden, crispy & perfectly salted.",available:true,best:false},
{id:7,cat:"Fries",name:"Loaded Fries",price:320,emoji:"🍟",desc:"Fries loaded with cheese & signature sauce.",available:true,best:true},
{id:8,cat:"Drinks",name:"Cold Drink",price:120,emoji:"🥤",desc:"Chilled soft drink.",available:true,best:false},
{id:9,cat:"Drinks",name:"Mineral Water",price:80,emoji:"💧",desc:"Chilled bottled water.",available:true,best:false}],
coupons:[{id:1,code:"CBC10",type:"percent",value:10,active:true}],
orders:[],customers:[]
};
function read(){return JSON.parse(fs.readFileSync(DB,"utf8"))}function write(x){fs.writeFileSync(DB,JSON.stringify(x,null,2))}
if(!fs.existsSync(DB))write(defaultData);
function auth(req,res,next){if(req.headers["x-admin-key"]!=="CBC-V5-ADMIN-KEY")return res.status(401).json({error:"Unauthorized"});next()}
app.get("/api/config",(q,s)=>{let d=read();s.json({settings:d.settings,menu:d.menu.filter(x=>x.available),coupons:d.coupons.filter(x=>x.active)})});
app.post("/api/orders",(q,s)=>{let d=read(),b=q.body;if(!b.name||!b.phone||!b.items?.length)return s.status(400).json({error:"Missing information"});let o={...b,id:"CBC-"+Date.now().toString().slice(-7),status:"Received",createdAt:new Date().toISOString()};d.orders.unshift(o);let c=d.customers.find(x=>x.phone===b.phone);if(c){c.orders++;c.spent+=b.total;c.lastOrder=o.createdAt}else d.customers.push({id:crypto.randomUUID(),name:b.name,phone:b.phone,orders:1,spent:b.total,lastOrder:o.createdAt});write(d);s.json(o)});
app.post("/api/admin/login",(q,s)=>q.body?.password==="cravingbiteadmin"?s.json({key:"CBC-V5-ADMIN-KEY"}):s.status(401).json({error:"Invalid password"}));
app.use("/api/admin",auth);
app.get("/api/admin/all",(q,s)=>s.json(read()));
app.put("/api/admin/settings",(q,s)=>{let d=read();d.settings={...d.settings,...q.body};write(d);s.json(d.settings)});
app.post("/api/admin/menu",(q,s)=>{let d=read(),x={...q.body,id:Date.now()};d.menu.push(x);write(d);s.json(x)});
app.put("/api/admin/menu/:id",(q,s)=>{let d=read(),x=d.menu.find(x=>x.id==q.params.id);if(!x)return s.status(404).json({error:"Not found"});Object.assign(x,q.body);write(d);s.json(x)});
app.delete("/api/admin/menu/:id",(q,s)=>{let d=read();d.menu=d.menu.filter(x=>x.id!=q.params.id);write(d);s.json({ok:true})});
app.post("/api/admin/coupons",(q,s)=>{let d=read(),x={id:Date.now(),...q.body};d.coupons.push(x);write(d);s.json(x)});
app.put("/api/admin/coupons/:id",(q,s)=>{let d=read(),x=d.coupons.find(x=>x.id==q.params.id);Object.assign(x,q.body);write(d);s.json(x)});
app.delete("/api/admin/coupons/:id",(q,s)=>{let d=read();d.coupons=d.coupons.filter(x=>x.id!=q.params.id);write(d);s.json({ok:true})});
app.put("/api/admin/orders/:id",(q,s)=>{let d=read(),x=d.orders.find(x=>x.id===q.params.id);if(!x)return s.status(404).json({error:"Not found"});Object.assign(x,q.body);write(d);s.json(x)});
app.listen(PORT,()=>console.log("Craving Bite Cafe V5 on "+PORT));