if("serviceWorker" in navigator){
    navigator.serviceWorker.register("/static/script/service_worker.js").then(registration=>{
      console.log("SW Registered!");
    }).catch(error=>{
        console.log(error)
      console.log("SW Registration Failed");
    });
}else{
  console.log("Not supported");
}