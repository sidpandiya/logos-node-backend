const functions = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');
const moment = require('moment');
var request = require('request');
admin.initializeApp();

exports.helloWorld = functions.https.onRequest((request, response) => {
     
    response.send("Hello from Firebase 3344! north ");
   });
  
  exports.completeProfile = functions.https.onRequest((req, res) => { 
  var corsFn = cors(); 
  
  corsFn(req, res, function() { 
  //completeProfileFn (req, res); 
  const userId = req.body.userId; // return "undefined" 
  const profilePicture = req.body.profilePicture; // return "undefined" 
  const username = req.body.username; // return "undefined" 
  
  console.log("Test: " + userId + ", " + profilePicture + ", " + username); 
  res.send("Hello from Firebase!");
  }); 
  })


/********************************************************************************** */
/* Function to add opinion for comments */
exports.addCommentOpinion = functions.https.onRequest((req,res)=>{
    const commentId = req.body.commentId;
  const userId = req.body.userId;
  const opinion = parseInt(req.body.opinion);
  var corsFn = cors();
  corsFn(req, res, function() { 
      var data={
          "userId":userId,
          "commentId":commentId,
          "opinion":opinion
      }
      console.log("got request data = "+data);
      var getOpinion = admin.database().ref('/commentopinion').orderByChild("userId").equalTo(userId);
      getOpinion.once('value').then((commentOpinions)=>{
       var count = 0;
       if(commentOpinions.exists()){
        console.log("commm "+JSON.stringify(commentOpinions));   
        commentOpinions.forEach(function(opnion){
            count++;
            console.log("opppppp "+opnion);
            console.log("22 "+opnion.val());
            console.log("got opinion :"+opnion.val().commentId+" ans commetni id is "+commentId);
            if(opnion.val().commentId === commentId){
                console.log("update comment opinion");
                admin.database().ref('/commentopinion').child(opnion.key).update(data).then((updateOpt)=>{
                   var status = {
                       code : 1,
                       msg : "Comment Opinion added succesfully"
                   }
                    return res.status(200).json(status);
                }).catch(err=>{
                    console.log("error while update "+err);
                    var errStatus = {
                        code : 0,
                        msg : "Error while update commwnt opinion"
                    }

                    return res.status(400).json(errStatus);
                });
                // opnion.update(data).then((updateOpt)=>{
                //     var status = {
                //         code : 1,
                //         msg : "Comment Opinion added succesfully"
                //     }
                //     return res.status(200).json(status);
                // }).catch(err=>{
                //     console.log("error in update getOpinion "+JSON.stringify(err));
                // });
            }
            else{
                console.log("count is :"+count+" got length is "+commentOpinions.numChildren())
                if(count === commentOpinions.numChildren()){
                    console.log("adding new opinion");
                    var myRef = admin.database().ref('/commentopinion').push(data).then((snapshot) => {
                        console.log("done "+snapshot.key);
                            var status={
                                code:1,
                                msg:"Opinion added succesfully.."
                            }
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("error in addCommentOpinion "+err)
                        var errorStatus = {
                            code : 0,
                            mgs : "Error in addCommentOpinion "+JSON.stringify(err),
                        }
                        return res.status(400).json(errorStatus);
                    })
                }
            }
           })
       }
       else{
        console.log("adding new opinion");
                    var myRef = admin.database().ref('/commentopinion').push(data).then((snapshot) => {
                        console.log("done "+snapshot.key);
                            var status={
                                code:1,
                                msg:"Opinion added succesfully.."
                            }
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("error in addCommentOpinion "+err)
                        var errorStatus = {
                            code : 0,
                            mgs : "Error in addCommentOpinion "+JSON.stringify(err),
                        }
                        return res.status(400).json(errorStatus);
                    })
       }
      
       return 0;
      }).catch(err=>{
          console.log("err "+err);
      })

     
  });
})



/********************************************************************************** */
/* Function to get searched reslts @Author subodh3344 
    This function search text in author first and then in news/post/article */
exports.searchNewsOrAuthor = functions.https.onRequest((req,res)=>{
    var searchText = req.body.searchText;
    console.log("in search function got word : "+searchText);
    var news=[];
    const rootRef = admin.database().ref();
    rootRef.child('/user').orderByChild('name').startAt(searchText).endAt(searchText+"\uf8ff").once('value').then((userSnap)=>{
        if(userSnap.exists()){

            var myFunctToRunAfter = function () {
                if(news[0].length === 0){
                     var status1={
                        code:2,
                        msg:"No Data Available",
                    //    data:news[0]
                    }
                    return res.status(200).json(status1);
                }
                else{
                     var status2={
                        code:1,
                        msg:"Got List of News",
                        data:news[0]
                    }
                    return res.status(200).json(status2);
                }
            }
            
            return new Promise(function(resolve, reject) {
                var newsList=[];
                userSnap.forEach((user)=>{
                    console.log("got user "+user.key);
                    // to get all news added by selected user
                   
                    admin.database().ref('/posts').orderByChild('userId').equalTo(user.key).once('value').then((snap)=>{
                      if(snap.exists()){
                        var count = 0;  
                        var totalSnapCount = 0;
                          snap.forEach((childSnapshot)=> {
                              totalSnapCount++;
                              stillUnderProcess = true;
                              console.log("count is "+count+" newz count "+snap.numChildren());
                              var userID=childSnapshot.val().userId;
                              var userRef = admin.database().ref('/user').child(userID);
                              userRef.once('value').then((userSnap)=> {
                                  console.log("in userSnap ");
                                  var userDetails=userSnap.val()
                                  var newsId=childSnapshot.key
                                  /*  Query to Get news L-R count from newslrcount table by newsId  */
                                  var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsId);
                                  newsLRRef.once('value').then((newsLRCountSnap)=> {
                                      var total=0;
                                      var lrCOunt=0;
                                      var avg = 0;
                                      newsLRCountSnap.forEach(news => {
                                          total++;
                                          lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                                      });
                                      if(lrCOunt !==0){
                                          avg=(lrCOunt/total)
                                      }
                                          /* Query to get postreacts for perticular news by news Id */
                                      var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsId);
                                      agreeRef.once('value').then((agreeSnap)=> {
                                          var agreeCount=0;
                                          var disagreeCount=0;
                                          var nuetralCount=0;
                                          agreeSnap.forEach(news => {
                                              var openion=parseInt(news.val().openion)
                                              if(openion===1){
                                                  agreeCount++;
                                              }
                                              else if(openion===0){
                                                  nuetralCount++;
                                              }
                                              else if(openion===2){
                                                  disagreeCount++;
                                              }
                                          })
                                        
                                              count++;
                                              var news2={
                                                  user:userDetails,
                                                  news:childSnapshot,
                                                  newsId:childSnapshot.key,
                                                  newsLRCount:avg,
                                                  agreeCount:agreeCount,
                                                  disagreeCount:disagreeCount,
                                                  neutralCount:nuetralCount,
                                                //  countryNewsViewCount :countryNewsViewCount
                                              }
                                              newsList.push(news2)
                                        
                                          stillUnderProcess = false;
                                        
                                              if(newsList.length===snap.numChildren()){
                                                  console.log("resolving function");
                                                  news.push(newsList)
                                                  resolve(myFunctToRunAfter());
                                              }
                                         
                                          return 0
                                              // agreeCatch
                                      }).catch(err=>{
                                          console.log("agree err "+err);
                                      })
                                      return 0;
                                          // newsLR REf Catch
                                      }).catch(err=>{
                                          console.log("newsLR err "+err);
                                      })
                                      return 0
                                      // userRef Catch    
                                  }).catch(err=>{
                                      console.log("userRef err "+err);
                                  })
                              })
                          }
                          else{
                              var status = {
                                  code : 0,
                                  msg : "Searched User has no news posted yet.."
                              }
                              return res.status(200).json(status);
                          }
                          return 0;
                      }).catch((err)=>{
                          console.log("got error during get user in search function "+err);
                          var errStatus = {
                              code : 0,
                              msg : "Got error while fetching user in search function "+err
                          }
                          return res.status(400).json(errStatus);
                      });
                  })
            });
            
        }
        // search in posts for search result
        else{
            console.log("get result from posts");
            var myFunctToRunAfter2 = function () {
                if(news[0].length === 0){
                     var status1={
                        code:2,
                        msg:"No Data Available",
                    //    data:news[0]
                    }
                    return res.status(200).json(status1);
                }
                else{
                     var status2={
                        code:1,
                        msg:"Got List of News",
                        data:news[0]
                    }
                    return res.status(200).json(status2);
                }
            }
            
            return new Promise(function(resolve, reject) {
                var newsList=[];
              
                // to get all news with title simillar to searched text
                   
                    admin.database().ref('/posts').orderByChild('title').startAt(searchText).endAt(searchText+"\uf8ff").once('value').then((snap)=>{
                      if(snap.exists()){
                        var count = 0;  
                        var totalSnapCount = 0;
                          snap.forEach((childSnapshot)=> {
                              totalSnapCount++;
                              stillUnderProcess = true;
                              console.log("count is "+count+" newz count "+snap.numChildren());
                              var userID=childSnapshot.val().userId;
                              var userRef = admin.database().ref('/user').child(userID);
                              userRef.once('value').then((userSnap)=> {
                                  console.log("in userSnap ");
                                  var userDetails=userSnap.val()
                                  var newsId=childSnapshot.key
                                  /*  Query to Get news L-R count from newslrcount table by newsId  */
                                  var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsId);
                                  newsLRRef.once('value').then((newsLRCountSnap)=> {
                                      var total=0;
                                      var lrCOunt=0;
                                      var avg = 0;
                                      newsLRCountSnap.forEach(news => {
                                          total++;
                                          lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                                      });
                                      if(lrCOunt !==0){
                                          avg=(lrCOunt/total)
                                      }
                                          /* Query to get postreacts for perticular news by news Id */
                                      var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsId);
                                      agreeRef.once('value').then((agreeSnap)=> {
                                          var agreeCount=0;
                                          var disagreeCount=0;
                                          var nuetralCount=0;
                                          agreeSnap.forEach(news => {
                                              var openion=parseInt(news.val().openion)
                                              if(openion===1){
                                                  agreeCount++;
                                              }
                                              else if(openion===0){
                                                  nuetralCount++;
                                              }
                                              else if(openion===2){
                                                  disagreeCount++;
                                              }
                                          })
                                        
                                              count++;
                                              var news2={
                                                  user:userDetails,
                                                  news:childSnapshot,
                                                  newsId:childSnapshot.key,
                                                  newsLRCount:avg,
                                                  agreeCount:agreeCount,
                                                  disagreeCount:disagreeCount,
                                                  neutralCount:nuetralCount,
                                                //  countryNewsViewCount :countryNewsViewCount
                                              }
                                              newsList.push(news2)
                                        
                                          stillUnderProcess = false;
                                        
                                              if(newsList.length===snap.numChildren()){
                                                  console.log("resolving function");
                                                  news.push(newsList)
                                                  resolve(myFunctToRunAfter2());
                                              }
                                         
                                          return 0
                                              // agreeCatch
                                      }).catch(err=>{
                                          console.log("agree err "+err);
                                      })
                                      return 0;
                                          // newsLR REf Catch
                                      }).catch(err=>{
                                          console.log("newsLR err "+err);
                                      })
                                      return 0
                                      // userRef Catch    
                                  }).catch(err=>{
                                      console.log("userRef err "+err);
                                  })
                              })
                          }
                          else{
                              var status = {
                                  code : 0,
                                  msg : "Searched User has no news posted yet.."
                              }
                              return res.status(200).json(status);
                          }
                          return 0;
                      }).catch((err)=>{
                          console.log("got error during get user in search function "+err);
                          var errStatus = {
                              code : 0,
                              msg : "Got error while fetching user in search function "+err
                          }
                          return res.status(400).json(errStatus);
                      });
                 });

        }
       // return 0;
    }).catch((err)=>{
        console.log("got error during get user in search function "+err);
        var errStatus = {
            code : 0,
            msg : "Got error while fetching user in search function "+err
        }
        return res.status(400).json(errStatus);
    });

    var status = {
        code : 1,
        msg : "done"
    }
    //return res.status(200).json(status);
});

/********************************************************************************** */


/********************************************************************************** */


/**Function to add points in data base 
 * URl:https://us-central1-logo-c60fc.cloudfunctions.net/addPoints
 * input:
 * {
            "title": "Linkdin",
            "points":100,
            "createdBy": 1,
            "createdOn":1,
            "modifiyedBy":1,
            "modifiedOn":1
 }
 output:
 {
    "code": 1,
    "msg": "Points Added scusseefully"
}
 */
 exports.addPoints=functions.https.onRequest((req,res)=>{
    var corsFn=cors();
    console.log("in add  points function ");
    corsFn(req, res, function() { 
        const title=req.body.title;
        let data=req.body;
        console.log("title "+title);
        var pointRef = admin.database().ref('/points');
       // admin.database().ref('/points').setValue("1")
         return admin.database().ref('/points').push(data).then((snapshot) => {
            // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
            console.log("sucess")
            var status={
                code:1,
                msg:"Points Added scusseefully"
            }
            return res.status(200).json(status);
          }).catch(err=>{
            console.log("eror")
            return res.status(400).json({points : err});
          });
    })
   
 })
 /**url to get element by ID (key in fireabase db)
 * url:https://us-central1-logo-c60fc.cloudfunctions.net/getPointsByKey?key=-LBAw2s7rNxwZiNckndb
 * output:{"points":{"createdBy":1,"createdOn":1,"modifiedOn":1,"modifiyedBy":1,"points":100,"title":"Linkdin"}}
 */
exports.getPointsByKey = functions.https.onRequest((req, res) => {
    let key=req.query.key;  
    var pointRef=admin.database().ref('points').child(key);
    pointRef.once('value').then(function(snap){
        var status={
            code:1,
            msg:"Points  by Key",
            data:snap.val()
        }
        return res.status(200).json(status);
    }).catch(error=>{
        var status={
            code:0,
            msg:"Error in getting Point by Key"
        }
        return res.status(400).json(status);
    });
 })
 /**URL to remove element by id(auto genrated key in firebase db )
  * url:https://us-central1-logo-c60fc.cloudfunctions.net/deletePointsByKey?key=-LBAzYp5VoICQ3pNV32q
  */

 exports.deletePointsByKey=functions.https.onRequest((req,res)=>{
     let key=req.query.key;
     var pointRef=admin.database().ref('points').child(key);
     pointRef.remove().then(function(snap){
        var status={
            code:1,
            msg:"Points Deleted scusseefully"
        }
        return res.status(200).json(status);
    }).catch(error=>{
        var status={
            code:0,
            msg:"Error in deleting Points"
        }
        return res.status(400).json(status);
    });
 })

 /*URL to get list of all points 
 url https://us-central1-logo-c60fc.cloudfunctions.net/getAllPoints
 output: list of all point / */
 exports.getAllPoints = functions.https.onRequest((req, res) => {
    var postsRef = admin.database().ref('points');
   postsRef.once('value').then(function(snap) {
    var status={
        code:0,
        msg:"List of Points",
        data:snap.val()
    }
    return res.status(200).json(status);
  }).catch(error=>{
    var status={
        code:0,
        msg:"Error in getting all Points"
    }
    return res.status(400).json(status);
   });
   
    
  });

  /**url to update data from data base 
   * url: https://us-central1-logo-c60fc.cloudfunctions.net/updatePoints?key=-LBB0Qh6aimQ3Npdir20
   * post data :
   * {
            "title": "Linkdin",
            "points":100,
            "createdBy": 1,
            "createdOn":1,
            "modifiyedBy":1,
            "modifiedOn":1
 }
   */
  exports.updatePoints=functions.https.onRequest((req,res)=>{
    let key=req.query.key;
    var pointRef=admin.database().ref('points');
    var child = pointRef.child(key);
    child.once('value', function(snapshot) {
      // pointRef.child().set(snapshot.val());
            child.update(req.body).then(function(snap){
                var status={
                    code:1,
                    msg:"Points Updated scusseefully"
                }
                return res.status(200).json(status);
            }).catch(error=>{
                var status={
                    code:0,
                    msg:"Error in Updating Points"
                }
                return res.status(400).json(status);
            });
    });

  })
  /* function to store the post and post content
  url: https://us-central1-logo-c60fc.cloudfunctions.net/addPost
  input:{
	"userId":1,
	"title":"testing idd",
	"des":"Dhundiraj Govind Phalke was born in a Marathi speaking Deshastha Brahmin[6] family on 30 April 1870 at Tryambakeshwar, 30 km from Nashik, Maharashtra, India, where his father was an accomplished scholar. He joined Sir J.J.School of Art, Mumbai in 1885. After passing from J.J.School in 1890, Phalke went to the Kala Bhavan, Maharaja Sayajirao University of Baroda in Vadodara, where he studied sculpture, engineering, drawing, painting and photography",
	"type":1,
	"media":"phots/mediA/KK",
    "latitude":"18.520430",
    "longitude":"73.856744"
}
   */
  exports.addPost=functions.https.onRequest((req,res)=>{
    var corsFn=cors();
    corsFn(req, res, function() { 
        let data=req.body;
        var post={
            "userId":req.body.userId,
            "type":req.body.type,
            "views":0,
            "media":req.body.media,
            "latitude":req.body.latitude,
            "longitude":req.body.longitude,
            "isReported":0,
            "isEdited":0,
            "isDeleted": 0,
            "createdOn":1,
            "deletedByAdmin":1,
            "modifiedOn":1,
            "title":req.body.title,
            // added new parameters for storing city and country @Author subodh3344 26.5.18
            "city":req.body.city,
            "country":req.body.country
        }
        var str = req.body.des
       
      
        var para = str.replace(/[\\.]+/g, ".\n")    
        var splited=para.split(".\n");
      
       var myRef = admin.database().ref('/posts').push(post).then((snapshot) => {
        
            console.log("done "+snapshot.key);
            var status={
                code:1,
                msg:"Post Added scusseefully",
                data:splited,
                snaap:snapshot.key
            }
            addConten(splited,snapshot.key)
            return res.status(200).json(status);
        }).catch(err=>{
            console.log("error is "+err)
            return res.status(400).json({points : err});
        })
    })
  });
  
 function addConten(splited,key){
     console.log("in addContent function"+splited)
     splited.forEach(line => {
        var postContent={
            postId:key,   
            content:line
        }
        var count=0;
        admin.database().ref('/postcontent').push(postContent).then(postSnap=>{
             count++;
             if(count=== splited.length){
                 var status={
                     code:1,
                     msg:"Post Added scusseefully"
                    // data:splited
                 }
                
             }
             return 0
         }).catch(err=>{
             console.log("error "+err)
         })
     });
 }
 /*url to get post content by post ID
url:https://us-central1-logo-c60fc.cloudfunctions.net/getAllPostContentByPostId?key=-LBL_MpjAJxozJfEjMW5/ */
exports.getAllPostContentByPostId = functions.https.onRequest((req, res) => {
    var postsRef = admin.database().ref('postcontent').orderByChild('postId').equalTo(req.query.key);
    postsRef.once('value').then(function(snap) {
        var status={
            code:0,
            msg:"List of Points",
            data:snap.val()
        }
        return res.status(200).json(status);
    }).catch(error=>{
        var status={
        code:0,
            msg:"Error in getting all Points"
        }
        return res.status(400).json(status);
    });
   
});


/*********************************************************************************************************************/
/*URL for get high endorsments and store it in users tabe 
@Author subodh3344 24.5.18 
MOdified by Mansi 13.06.2018*/ 

exports.getHighEndorcements = functions.https.onRequest((request,response)=>{
    /*console.log("Executing getHighEndorcements function");
    const dbRef = admin.database().ref();
    const endorcementRef = dbRef.child('/userknowsabout');
    // endorcementRef.orderByChild("endorsementCount").on('endorsementCount', function(fbdata) {
    //     console.log(fbdata.exportVal());
    //   })
    endorcementRef.orderByChild('userId').equalTo('-LCsC1mpoM8cu1k8nF-v')
    .once('value').then(function(data){
        console.log("got data "+JSON.stringify(data.val()));
        var p = data.val();
        Array.prototype.max = function() {
        return Math.max.apply(null, this);
        };
        console.log("Max value is: "+Math.max.apply(0,p.map(function(v){return v.endorsementCount})));
        var res=Math.max.apply(0,p.map(function(v){return v.endorsementCount}));
        var finalData = p.find(function(o){ return o.endorsementCount === res; })
       
        var status={
            "code":1,
            "msg":"Heights Endorsment",
            "data":finalData
        }
        return response.status(200).json(status);
    }).catch(error=>{
        return response.status(400);
    });

    // endorcementRef.orderByChild('endorcementCount').on('endorcementCount',function(gotdata){
    //     console.log("sss "+JSON.stringify(gotData.val()));
    // });*/
    var pArray = [];
    var userId=request.query.key;
    var userknowsRef = admin.database().ref('/userknowsabout')
            .orderByChild('userId').equalTo(userId)
            userknowsRef.once('value').then(function(userknowsSnap) {
                console.log("userknowsSnap "+JSON.stringify(userknowsSnap.val()))
                // changed code 
                if(userknowsSnap.exists()){
                    userknowsSnap.forEach((UKSnap)=>{
                        //console.log("in foreach od userKnowsSnap "+JSON.stringify(UKSnap));
                        pArray.push(UKSnap);
                    })
                   var p =pArray;
                    //var p = userknowsSnap.val();
                    Array.prototype.max = function() {
                    return Math.max.apply(null, this);
                    };
                    var res = 0;
                    var finalData = {};
                    if(p === null){
                        //console.log("Endorcement is null");
                        finalData = {
                            endorcementCount : 0,
                            userId : userId,
                            isDeleted : 0,
                            knowledge : "NA"
                        };
                    }
                    else{
                        console.log("P is  "+JSON.stringify(p));
                         res = Math.max.apply(Math,p.map(function(o){
                            var test=JSON.stringify(o);
                            test=JSON.parse(test)
                            return parseInt(test.endorsementCount);}))
                        console.log("res "+res);
                        finalData =p.find(function(o){
                            var test=JSON.stringify(o);
                            test=JSON.parse(test)
                            return test.endorsementCount === res; })
                        console.log("final data "+JSON.stringify(finalData));
                        var test=JSON.stringify(finalData);
                            test=JSON.parse(test)
                       console.log("resolving in else:"+finalData.knowledge +" "+finalData.endorsementCount );
                       updateUserData(userId,test.knowledge,test.endorsementCount);
                    }
                    var status={
                        code:1,
                        msg:"High Endorsment updated"
                    }
                    return response.status(200).json(status);
                }
                else{
                    updateUserData(userId,"NA",0);
                    var status1={
                        code:1,
                        msg:"High Endorsment updated"
                    }
                    return response.status(200).json(status1);
                }
            }).catch(err=>{
                console.log("error in getting user knows about it "+err);
                var status={
                    code:0,
                    error:"Error in High Endorsment updated"
                }
                return response.status(500).json(status);
            })
        
});
function updateUserData(userId,highEndorsmentName,highEndorsmentCount){
    console.log("highEndorsmentName "+highEndorsmentName);
    console.log("highEndorsmentCount "+highEndorsmentCount);

    var url="/user/"+userId
    var userRef = admin.database().ref(url)
    userRef.update({ "highEndorsmentName":highEndorsmentName,
    "highEndorsmentCount":highEndorsmentCount}).then((postOpnionDatasnapshot) => {
       // console.log("snapshot "+postOpnionDatasnapshot)
      
       return 0;
       
    }).catch(err=>{
        console.log("error in user  update "+err);
        
    })
}
/***********************************************************************************************************************/
/******************************************************************/
/**
 * Copy of getAllpost url but we are not considering latitude and longitude in it
 * @Author subodh3344
 * This was new requirement from siddharth pandiya after call on 24.7.18
 */
exports.getAllPosts2 = functions.https.onRequest((req, res) => {
    console.log("Executing getAllPosts function");
    moment.updateLocale('en', {
        relativeTime : {
            future: "%s",
            past:   "%s",
            s  : 'a few seconds',
            ss : '%d seconds',
            m:  " mintues",
            mm: "%d mintues",
            h:  "1h",
            hh: "%dh",
            d:  "1d",
            dd: "%dd",
            M:  "1m",
            MM: "%dm",
            y:  "1y",
            yy: "%dy"
        }
    });
    // variables 
    var start = req.body.start; 
    var offset = req.body.offset;
    console.log("git body is "+JSON.stringify(req.body));
    console.log("Got Type "+req.body.type);
    var type = parseInt(req.body.type);
    
    const rootRef = admin.database().ref();
    var postsRef =rootRef.child('/posts')
    // type 0 for all posts
    if(type===0){
        console.log("in type 0 changed");
        if(start === 0 || start ==='0'){
            postsRef = rootRef.child('/posts').limitToFirst(offset);
        }
        else{
            postsRef = rootRef.child('/posts').startAt(null,start).limitToFirst(offset);
        }
     
    }
    /* type 1 . Article
            2 . Post
            3 . Media
    */
    else{
        console.log("in type not in 0 changed");
        //postsRef = rootRef.child('/posts').orderByChild('type').equalTo(type).startAt(null,start).limitToFirst(offset);
        if(start === 0 || start ==='0'){
            postsRef = rootRef.child('/posts').orderByChild('type').equalTo(type).limitToFirst(offset);
        }
        else{
            postsRef = rootRef.child('/posts').orderByChild('type').equalTo(type).startAt(null,start).limitToFirst(offset);
        }
    }
  console.log("post ref isssss "+JSON.stringify(postsRef));
  //  postsRef.where('latitude', '==', lat).where('longitude', '==', long);
    var list=[];
    //latitude
    postsRef.once('value').then(function(snap) {
    //    console.log("snap "+JSON.stringify(snap))
       var news=[];
       // functions runs after complete execution of loop 
       console.log("got posts exixst "+snap.exists());
       // to check if values present in database
       if(snap.val() !==null){
          console.log("in exixsts if");
            var myFunctToRunAfter = function () {
                if(news[0].length === 0){
                     var status1={
                        code:2,
                        msg:"No Data Available",
                    //    data:news[0]
                    }
                    return res.status(200).json(status1);
                }
                else{
                    // news[0].sort(function(x, y){
                    //     return new Date(y.createdOn).getTime() - new Date(x.createdOn).getTime();
                    // })
                    // console.log(" news[0] "+ news[0]);
                     //getting result in reverse manner need to reverse it 
					 var newsFinalArray=news[0]
                     var status2={
                        code:1,
                        msg:"Got List of News",
                        data:newsFinalArray
                    }
                    return res.status(200).json(status2);
                }
            }

            return new Promise(function(resolve, reject) {

                var count=0;
              
                var newsList=[];
                var totalSnapCount = 0;
                var stillUnderProcess = false;
                snap.forEach(function(childSnapshot) {
                    var isDrop=false;
                    console.log("childSnapshot.key "+childSnapshot.key+ " isDrop  "+isDrop);
                    if(childSnapshot.key === start){
                        isDrop=true;
                    }
                    else{
                        isDrop=false;
                    }
                    totalSnapCount++;
                    stillUnderProcess = true;
                    count++;
                    console.log("cild "+JSON.stringify(childSnapshot.val().userId));
                    var userID=childSnapshot.val().userId;
                    var userRef = admin.database().ref('/user').child(userID);
                    userRef.once('value').then(function(userSnap) {
                        var userDetails=userSnap.val()
                        var newsId=childSnapshot.key
                        /*  Query to Get news L-R count from newslrcount table by newsId  */
                        var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsId);
                        newsLRRef.once('value').then(function(newsLRCountSnap) {
                            var total=0;
                            var lrCOunt=0;
                            var avg = 0;
                            newsLRCountSnap.forEach(news => {
                                console.log("news each"+news.val().lRcount);
                                total++;
                                lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                            });
                            console.log("lrcount "+lrCOunt)
                            if(lrCOunt !==0){
                                avg=(lrCOunt/total)
                            }
                            /* Query to get postreacts for perticular news by news Id */
                            var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsId);
                            agreeRef.once('value').then(function(agreeSnap) {
                                var agreeCount=0;
                                var disagreeCount=0;
                                var nuetralCount=0;
                                agreeSnap.forEach(news => {
                                    var openion=parseInt(news.val().openion)
                                    if(openion===1){
                                        agreeCount++;
                                    }
                                    else if(openion===0){
                                        nuetralCount++;
                                    }
                                    else if(openion===2){
                                        disagreeCount++;
                                    }
                                })
                                var pArray = [];
                                var userknowsRef = admin.database().ref('/userknowsabout').orderByChild('userId').equalTo(userID)
                                userknowsRef.once('value').then(function(userknowsSnap) {
                                    console.log("userknowsSnap "+JSON.stringify(userknowsSnap.val()))
                                                                      
                                    console.log("date from now  "+moment(childSnapshot.val().createdOn, "YYYY-MM-DD HH:mm Z").fromNow());
                                    var timeago=moment(childSnapshot.val().createdOn, "YYYY-MM-DD HH:mm Z").fromNow()
                                    var news1={
                                            user:userDetails,
                                            news:childSnapshot,
                                            newsId:childSnapshot.key,
                                            newsLRCount:avg,
                                            agreeCount:agreeCount,
                                            disagreeCount:disagreeCount,
                                            neutralCount:nuetralCount,
                                            //userknowsabout:finalData,
                                            countryNewsViewCount:0,
                                            timeAgo:timeago,
                                            createdOn:childSnapshot.val().createdOn
                                    }
                                    newsList.push(news1)
                                    if(isDrop){
                                        newsList=newsList.slice(1);
                                        count=count-1;
                                    }
                                    console.log("count : "+count+" newsList length : "+newsList.length);
                                    stillUnderProcess = false;
                                    if(count===newsList.length){
                                        console.log("resolving function");
                                        news.push(newsList)
                                        resolve(myFunctToRunAfter())
                                    }
                                    return 0
                                        // userKnown catch    
                                    }).catch(err=>{
                                        console.log("userKnows err "+err)
                                    })
                                    return 0
                                    // agreeCatch
                                }).catch(err=>{
                                    console.log("agree err "+err)
                                })
                                return 0;
                                // newsLR REf Catch
                            }).catch(err=>{
                                console.log("newsLR err "+err)
                            })
                            return 0
                            // userRef Catch    
                        }).catch(err=>{
                            console.log("userRef err "+err)
                        })
                        // end If   
                   
                })
            })
        }
        else{
            console.log("Got empty data");
            var status={
                code:2,
                msg:"No Data Available"
            }
            return res.status(400).json(status);
        }
    }).catch(error=>{
        console.log("in error of  getAllPosts2: "+JSON.stringify(error));
        var status={
            code:2,
            msg:"No Data Found wewe"
        }
        return res.status(400).json(status);
    });
    // var status = {
    //     code :0,
    //     msg : "No Data Found"
    // }
    // return res.status(400).json(status);
});
/***************************************************************** */


/***********************************************************************************************************************/
/*url to get all news list 
url:https://us-central1-logos-app-915d7.cloudfunctions.net/getAllPosts
*/
/*
    changed url to get city wise news by sending latitude and longitude 
    @Author subodh3344 22.5.18

    returns :
     code 0 : error,
          1 : Data is available,
          2 : No Data Avaailable



Input :   {
	        "type":0,
	        "Lat":current_latitude_here,
	        "Long":current_longitude_here
        }

*/
exports.getAllPosts = functions.https.onRequest((req, res) => {
    console.log("Executing getAllPosts function");
    // variables 
    var Lat = req.body.Lat; 
    var Long = req.body.Long;

    console.log("Got Type "+req.body.type);
    var type = parseInt(req.body.type);
    const rootRef = admin.database().ref();
    var postsRef =rootRef.child('/posts');
    // type 0 for all posts
    if(type===0){
        console.log("in type 0");
        postsRef = rootRef.child('/posts');
    }
    /* type 1 . Article
            2 . Post
            3 . Media
    */
    else{
        console.log("in type not in 0");
        postsRef = rootRef.child('/posts').orderByChild('type').equalTo(type);
    }
  
  //  postsRef.where('latitude', '==', lat).where('longitude', '==', long);
    var list=[];
    //latitude
    postsRef.once('value').then(function(snap) {
    //    console.log("snap "+JSON.stringify(snap))
       var news=[];
       // functions runs after complete execution of loop 
       console.log("got posts exixst "+snap.exists());
       // to check if values present in database
       if(snap.val() !==null){
          console.log("in exixsts if");
            var myFunctToRunAfter = function () {
                if(news[0].length === 0){
                     var status1={
                        code:2,
                        msg:"No Data Available",
                    //    data:news[0]
                    }
                    return res.status(200).json(status1);
                }
                else{
                     var status2={
                        code:1,
                        msg:"Got List of News",
                        data:news[0]
                    }
                    return res.status(200).json(status2);
                }
            }

            return new Promise(function(resolve, reject) {

                var count=0;
                var newsList=[];
                var totalSnapCount = 0;
                var stillUnderProcess = false;
                snap.forEach(function(childSnapshot) {
                    totalSnapCount++;
                /*To check if current news is in required latitude and longitude @Author subodh3344 23.5.18 */
                    var newsLat = childSnapshot.val().latitude;
                    var newsLong = childSnapshot.val().longitude;
                    console.log("Before If Got news's lat "+newsLat+" long "+newsLong);  
                    var startLat = Lat - 2;
                    console.log("startlat "+startLat);
                    var endLat = Lat + 2 ;
                    var startLong = Long - 2 ;
                    var endLong = Long + 2;
                    console.log(newsLat+" >= "+startLat+" && "+newsLat+" <= "+endLat+" && "+newsLong+" >= "+startLong+" && "+newsLong+" <= "+endLong);          
                    if(newsLat >= startLat && newsLat <= endLat && newsLong >= startLong && newsLong <= endLong){
                        stillUnderProcess = true;
                        console.log("Inside If ");
                        count++;
                        console.log("cild "+JSON.stringify(childSnapshot.val().userId));
                        var userID=childSnapshot.val().userId;
                        var userRef = admin.database().ref('/user').child(userID);
                        userRef.once('value').then(function(userSnap) {
                            var userDetails=userSnap.val()
                            var newsId=childSnapshot.key
                            /*  Query to Get news L-R count from newslrcount table by newsId  */
                            var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsId);
                            newsLRRef.once('value').then(function(newsLRCountSnap) {
                                var total=0;
                                var lrCOunt=0;
                                var avg = 0;
                                newsLRCountSnap.forEach(news => {
                                    console.log("news each"+news.val().lRcount);
                                    total++;
                                    lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                                });
                                console.log("lrcount "+lrCOunt)
                                if(lrCOunt !==0){
                                    avg=(lrCOunt/total)
                                }
                                /* Query to get postreacts for perticular news by news Id */
                                var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsId);
                                agreeRef.once('value').then(function(agreeSnap) {
                                    var agreeCount=0;
                                    var disagreeCount=0;
                                    var nuetralCount=0;
                                    agreeSnap.forEach(news => {
                                        var openion=parseInt(news.val().openion)
                                        if(openion===1){
                                            agreeCount++;
                                        }
                                        else if(openion===0){
                                            nuetralCount++;
                                        }
                                        else if(openion===2){
                                            disagreeCount++;
                                        }
                                    })
                                    //need to change as we want hight endorcement
                                    /*Get authors information of given news by user Id */
                                    var userknowsRef = admin.database().ref('/userknowsabout').orderByChild('userId').equalTo(userID)
                                    userknowsRef.once('value').then(function(userknowsSnap) {
                                       console.log("userknowsSnap "+JSON.stringify(userknowsSnap.val()))
                                       var p = userknowsSnap.val();
                                       Array.prototype.max = function() {
                                       return Math.max.apply(null, this);
                                       };
                                       var res = 0;
                                       var finalData = {};
                                      if(p === null){
                                        console.log("Endorcement is null");
                                        finalData = {
                                            endorcementCount : 0,
                                            userId : userID,
                                            isDeleted : 0,
                                            knowledge : "NA"
                                        };
                                       }
                                       else{
                                        console.log("endorcementCount length is "+p.length);
                                        console.log("Max value is: "+Math.max.apply(0,p.map(function(v){return v.endorsementCount})));
                                        res=Math.max.apply(0,p.map(function(v){return v.endorsementCount}));
                                        finalData = p.find(function(o){ return o.endorsementCount === res; });
                                       }
                                       
                                       
                                        var news1={
                                            user:userDetails,
                                            news:childSnapshot,
                                            newsId:childSnapshot.key,
                                            newsLRCount:avg,
                                            agreeCount:agreeCount,
                                            disagreeCount:disagreeCount,
                                            neutralCount:nuetralCount,
                                            userknowsabout:finalData,
                                        }
                                        newsList.push(news1)
                                        console.log("count : "+count+" newsList length : "+newsList.length);
                                        stillUnderProcess = false;
                                        if(count===newsList.length){
                                            console.log("resolving function");
                                            news.push(newsList)
                                            resolve(myFunctToRunAfter())
                                        }
                                        return 0
                                        // userKnown catch    
                                    }).catch(err=>{
                                        console.log("userKnows err "+err)
                                    })
                                    return 0
                                    // agreeCatch
                                }).catch(err=>{
                                    console.log("agree err "+err)
                                })
                                return 0;
                                // newsLR REf Catch
                            }).catch(err=>{
                                console.log("newsLR err "+err)
                            })
                            return 0
                            // userRef Catch    
                        }).catch(err=>{
                            console.log("userRef err "+err)
                        })
                        // end If   
                    }
                    else{
                        console.log("in else not same and stillUnderProcess is "+stillUnderProcess);
                        console.log("total snap count = "+totalSnapCount+" snap length is "+snap.numChildren());
                        if(totalSnapCount === snap.numChildren()){
                            if(!stillUnderProcess){
                                console.log("add resolve here");
                                resolve(myFunctToRunAfter());
                            }
                        }
                    }
                })
            })
        }
        else{
            console.log("Got empty data");
            var status={
                code:2,
                msg:"No Data Available"
            }
            return res.status(400).json(status);
        }
    }).catch(error=>{
        console.log("in error of  postsRef.once('value') : "+JSON.stringify(error));
        var status={
            code:2,
            msg:"No Data Found wewe"
        }
        return res.status(400).json(status);
    });
    // var status = {
    //     code :0,
    //     msg : "No Data Found"
    // }
    // return res.status(400).json(status);
});


/****************************************************************************************************************/
exports.getNewsById = functions.https.onRequest((req, res) => {
    let key=req.query.key;  
   var news={};
   var pointRef=admin.database().ref('posts').child(key);
   pointRef.once('value').then(snap=>{
       var news={}
       var myFunctToRunAfter = function () {
     
           console.log("news "+JSON.stringify(news));
           var status={
               code:0,
               msg:"News Details",
               data:news
           }
           return res.status(200).json(status);
         }
       return new Promise(function(resolve, reject) {
           var userDetails=null;
           console.log("snap.val().userId "+snap.val());
           var userRef = admin.database().ref('/user').child(snap.val().userId);
           userRef.once('value').then(userSnap=> {
               console.log("userSnap "+JSON.stringify(userSnap));
               userDetails=userSnap.val();
               var newsDetails=[];
               var postsRef = admin.database().ref('/postcontent').orderByChild('postId').equalTo(snap.key);
               postsRef.once('value').then(function(newsSnap) {
                   console.log("newsSnap"+JSON.stringify(newsSnap.val()));
                   var obj=Object.keys(newsSnap.val());
                   newsSnap.forEach(function (childSnapshot) {
                        var postcontentReactCoutDetailsRef = admin.database().ref('/postcontentReactCoutDetails')
                        .orderByChild('postContentId').equalTo(childSnapshot.key);
                            postcontentReactCoutDetailsRef.once('value').then(postcontentReactCoutDetailsSnap=> {
                                var agreeCount=0;
                                var disagreeCount=0;
                                var neutralCount=0;
                                var total=0;
                                postcontentReactCoutDetailsSnap.forEach(function (childSnapshot) {
                                   var value= childSnapshot.val();
                                 
                                   agreeCount=value.agreeCount;
                                   disagreeCount=value.disagreeCount;
                                     neutralCount=value.neutralCount;
                                     total=value.total;
                                    
                                });
                                console.log("total "+total);
                                console.log("agreeCount "+agreeCount);
                                var agreePercentage=(agreeCount/total)*100;
                                var disagreePercentage=(disagreeCount/total)*100;
                                var neutralPercentage=(neutralCount/total)*100
                                var heighPercentage=Math.max(agreePercentage, disagreePercentage,neutralPercentage)
                                console.log("heighPercentage "+heighPercentage);
                                var color=0
                                if (heighPercentage===agreePercentage){
                                    color=1;
                                }
                                else if (heighPercentage===neutralPercentage){
                                    color=0;
                                }
                                else if (heighPercentage===disagreePercentage){
                                    color=2;
                                }
                                if(heighPercentage===null || !heighPercentage || isNaN(heighPercentage)){
                                    heighPercentage=0
                                }
                                var news={
                                    "id":childSnapshot.key,
                                    "content":childSnapshot,
                                    "color":color,
                                    "heighPercentage":heighPercentage.toFixed(2)
                                }
                                newsDetails.push(news);
                                return 0;
                        }).catch(err=>{
                            console.log("error in gettin statment opinion Details "+err)
                        })
                  
                   });
                   var newsID=snap.key
                   var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsID);
                   newsLRRef.once('value').then(function(newsLRCountSnap) {
                       var total=0;
                       var lrCOunt=0;
                       var avg = 0;
                      newsLRCountSnap.forEach(news => {
                          console.log("news each"+JSON.stringify(news));
                           total++;
                           lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                       });
                       if(lrCOunt !==0){
                        avg=(lrCOunt/total)
                       }
                       var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsID);
                       agreeRef.once('value').then(function(agreeSnap) {
                           console.log("agreeSnap "+JSON.stringify(agreeSnap.val()));
                           var agreeCount=0;
                           var disagreeCount=0;
                           var nuetralCount=0;
                           agreeSnap.forEach(news => {
                               console.log("news openion "+news.val().openion);
                               var openion=parseInt(news.val().openion)
                               if(openion===1){
                                   agreeCount++;
                               }
                               else if(openion===0){
                                   nuetralCount++;
                               }
                               else if(openion===2){
                                   disagreeCount++;
                               }
                           })
                           var pArray = [];
                           var userknowsRef = admin.database().ref('/userknowsabout').orderByChild('userId').equalTo(snap.val().userId)
                                    userknowsRef.once('value').then(function(userknowsSnap) {
                                       console.log("userknowsSnap "+JSON.stringify(userknowsSnap.val()))
                                       userknowsSnap.forEach((UKSnap)=>{
                                        console.log("in for userKnowsSnap "+UKSnap);
                                        pArray.push(UKSnap);
                                       })
                                       //var p = userknowsSnap.val();
                                       var p = pArray;
                                       console.log("After pushing p is "+p);
                                       Array.prototype.max = function() {
                                       return Math.max.apply(null, this);
                                       };

                                       var res = 0;
                                       var finalData = {};
                                      if(p === null){
                                        console.log("Endorcement is null");
                                        finalData = {
                                            endorcementCount : 0,
                                            userId : snap.val().userId,
                                            isDeleted : 0,
                                            knowledge : "NA"
                                        };
                                       }
                                       else{
                                        console.log("endorcementCount length is "+p.length);
                                        console.log("Max value is: "+Math.max.apply(0,p.map(function(v){return v.endorsementCount})));
                                        res=Math.max.apply(0,p.map(function(v){return v.endorsementCount}));
                                        finalData = p.find(function(o){ return o.endorsementCount === res; });
                                       }
                                       
                                    //    console.log("Max value is: "+Math.max.apply(0,p.map(function(v){return v.endorsementCount})));
                                    //    var res=Math.max.apply(0,p.map(function(v){return v.endorsementCount}));
                                    //    var finalData = p.find(function(o){ return o.endorsementCount === res; })
                                       console.log("avg is "+avg);
                               news={
                                   newsId:snap.key,
                                   newsDetails:snap.val(),
                                   userDetails:userDetails,
                                   newsContent:newsDetails,
                                   newsLRCount:avg,
                                   agreeCount:agreeCount,
                                   disagreeCount:disagreeCount,
                                   neutralCount:nuetralCount,
                                   userEndorsment:finalData,
                                   userId : snap.val().userId
                               }
                               resolve(myFunctToRunAfter())
                               return 0;
                           }).catch(err=>{
                               console.log("err "+err)
                           })
                          
                           return 0
                       }).catch(err=>{
                           console.log("err "+err)
                       })
                      
                       return 0
                   }).catch(err=>{
                       console.log("err"+err)
                   })
                   return newsDetails
               }).catch(error=>{
                   console.log("error "+error)
               });
            return 0
           }).catch(err=>{
               console.log("error "+err)
           })
          return news
         
       })
   }).catch(err=>{
       console.log("error in gettin news details"+err)
   })
})
/************************************************************************************************************** /
/**url to add user data with personal details,user credentials, user knows about 
* data :
* {
           "name" : "Mansi",
           "email" : "mansi@technicia.in",
           "contact" : 1234567890,
           "longitude" : "-56.472",
           "latitude":"52.36",
           "socialId":"78954160",
           "photoUrl":"yujnm/myuj",
           "isDeleted":0,
           "logginType":1,
           "isNormalUser":1,
           "creadentials":[
                   
               ],
           "knowsAbout":[
               
               ]
    
}
url:
https://us-central1-logo-c60fc.cloudfunctions.net/addUser
*/
exports.addUser=functions.https.onRequest((req,res)=>{
    var corsFn=cors();
    corsFn(req, res, function() { 
        var userData = {
            "name" : req.body.name,
            "email" : req.body.email,
            "contact" : req.body.contact,
            "longitude" : req.body.longitude,
            "latitude":req.body.latitude,
            "socialId":req.body.socialId,
            "photo":req.body.photoUrl,
            "isDeleted":0,
            "logginType":req.body.logginType,
            "isNormalUser":req.body.isNormalUser,
            "highEndorsmentName":"NA",
            "highEndorsmentCount":0,
            "city" : req.body.city,
            "country" : req.body.country,
            "currentCity" : req.body.currentCity,
            "currentCountry" : req.body.currentCountry,
            "politicalOrientation" : req.body.politicalOrientation
        }
        var logginType=parseInt(req.body.logginType);
        var userCredentials=req.body.creadentials;
        var userKnowsAbout=req.body.knowsAbout;
        var usercreadentialsCount=0;
        var userknowsaboutCount=0;
      //  console.log("logginType "+logginType +" "+req.body.logginType+ " "+parseInt(req.body.logginType));
        var myRef = admin.database().ref('/user').push(userData).then((snapshot) => {
            console.log("user added 1"+snapshot)
            var user={};
            var myFunctToRunAfter = function () {
                console.log("in myFunction")
                    var status={
                         code:1,
                         msg:"User ADDED SUCCESSFULY ",
                         userId:snapshot.key,
                         userData:user
                     }
                     return res.status(200).json(status);
                   }
            return new Promise(function(resolve, reject) {
                admin.database().ref('/user').child(snapshot.key).once('value').then(userSnapshot=> {
                    console.log("user "+JSON.stringify(userSnapshot.val()));
                    user=userSnapshot.val();
                    if(userCredentials.length !== 0){
                        userCredentials.forEach(credentials => {
                            var userCredentialsData={
                                "creadentials":credentials.name,
                                "userId":snapshot.key
                            }
                            admin.database().ref('/usercreadentials').push(userCredentialsData).then(credentialSnap=>{
                                //console.log("credentialSnap "+JSON.stringify(credentialSnap.val()))
                                usercreadentialsCount++;
                                if( usercreadentialsCount === userCredentials.length){
                                    if(logginType===2){
                                        var points=0;
                                       var pointRef=admin.database().ref('/points')
                                        .orderByChild('title').equalTo("Linkdin");
                                        pointRef.once('value').then(function(pointSnapshot) {
                                            
                                            pointSnapshot.forEach(function (childSnapshot) {
            
                                            var value = childSnapshot.val();
                                            points=value.points;
                                            console.log("Title is : " + value.points);
                                        });
                                          var userPointsData={
                                              "points":points,
                                              "userId":snapshot.key,
                                              "note":"Linkdin login benifit"
                                          }
                                          var myRef = admin.database().ref('/userpoints').push(userPointsData)
                                          .then((userpointSnapshot) => {
                                              console.log("user points added  ");
                                            resolve(myFunctToRunAfter())
                                            return 0;
                                          }).catch(err=>{
                                              console.log("Error in adding user points "+err);
                                          });
                                        
                                          return 0
                                        //  return res.status(200).json({points:snapshot});
                                        }).catch(error=>{
                                        console.log("error in getting points from point table "+error)
                                          //return res.status(200).json({points:0});
                                        });
                                      
                                    }  
                                }
                                return 0
                            }).catch(err=>{
                                console.log("error in adding user credentials becasus "+err)
                            })
                        })
                    }
                    if(userKnowsAbout.length !== 0){
                        userKnowsAbout.forEach(knowsAbout => {
                            var knowsAboutData={
                                "endorsementCount":0,
                                "userId":snapshot.key,
                                "knowledge":knowsAbout.knowledge
                            }
                            admin.database().ref('/userknowsabout').push(knowsAboutData).then(knowsAboutSnap=>{
                               // console.log("knowsAboutSnap "+JSON.stringify(knowsAboutSnap.val()))
                               userknowsaboutCount++; 
                               console.log("usercreadentialsCount "+usercreadentialsCount)
                               console.log("userknowsaboutCount "+userknowsaboutCount)
                               if( usercreadentialsCount === userCredentials.length &&  userknowsaboutCount===userKnowsAbout.length){
                                if(logginType===2){
                                    var points=0;
                                   var pointRef=admin.database().ref('/points')
                                    .orderByChild('title').equalTo("Linkdin");
                                    pointRef.once('value').then(function(pointSnapshot) {
                                        
                                        pointSnapshot.forEach(function (childSnapshot) {
        
                                        var value = childSnapshot.val();
                                        points=value.points;
                                        console.log("Title is : " + value.points);
                                    });
                                      var userPointsData={
                                          "points":points,
                                          "userId":snapshot.key,
                                          "note":"Linkdin login benifit"
                                      }
                                      var myRef = admin.database().ref('/userpoints').push(userPointsData)
                                      .then((userpointSnapshot) => {
                                          console.log("user points added  ");
                                        resolve(myFunctToRunAfter())
                                        return 0;
                                      }).catch(err=>{
                                          console.log("Error in adding user points "+err);
                                      });
                                    
                                      return 0
                                    //  return res.status(200).json({points:snapshot});
                                    }).catch(error=>{
                                    console.log("error in getting points from point table "+error)
                                      //return res.status(200).json({points:0});
                                    });
                                  
                                }  
                            
                               } 
                               
                                return 0
                            }).catch(err=>{
                                console.log("error in adding user knows about becasus "+err)
                            })
                        })
                    }
                    if(userCredentials.length===0 && userKnowsAbout.length===0){
                        if(logginType===2){
                            var points=0;
                           var pointRef=admin.database().ref('/points')
                            .orderByChild('title').equalTo("Linkdin");
                            pointRef.once('value').then(function(pointSnapshot) {
                                
                                pointSnapshot.forEach(function (childSnapshot) {
    
                                var value = childSnapshot.val();
                                points=value.points;
                                console.log("Title is : " + value.points);
                            });
                              var userPointsData={
                                  "points":points,
                                  "userId":snapshot.key,
                                  "note":"Linkdin login benifit"
                              }
                              var myRef = admin.database().ref('/userpoints').push(userPointsData)
                              .then((userpointSnapshot) => {
                                  console.log("user points added  ");
                                resolve(myFunctToRunAfter())
                                return 0;
                              }).catch(err=>{
                                  console.log("Error in adding user points "+err);
                              });
                            
                              return 0
                            //  return res.status(200).json({points:snapshot});
                            }).catch(error=>{
                            console.log("error in getting points from point table "+error)
                              //return res.status(200).json({points:0});
                            });
                          
                        }
                        else{
                            resolve(myFunctToRunAfter())
                        }
                    }
                    
                    return 0;
                }).catch(err=>{
                    console.log("error in getting user info "+err);
                })    
               
                
            })
            
        }).catch(err=>{
            var status={
                code:0,
                msg:"Error in getting Point by Key"
            }
            console.log("err "+err)
            return res.status(400).json(status);
        })
        
    })
 })

/*************************************************************************************************************** */
/**url to check user is alredy registred or not 
 * data:
 * {
	"socialId":"88885599",
	"email":"mansi1@technicia.in"
}
url:
https://us-central1-logo-c60fc.cloudfunctions.net/CheckUserAlreadyPresent
 */
/**url to check user is alredy registred or not 
* data:
* {
    "socialId":"88885599",
    "email":"mansi1@technicia.in"
}
url:
https://us-central1-logo-c60fc.cloudfunctions.net/CheckUserAlreadyPresent
*/
exports.CheckUserAlreadyPresent=functions.https.onRequest((req,res)=>{
    var socialId=req.body.socialId;
    var email=req.body.email;
    var isSocialIDPresent=true;
    var isEmailPresent=true;
    var status={}
    var userRef = admin.database().ref('user').orderByChild('socialId').equalTo(socialId);
    userRef.once('value').then(snap=> {
        var user={}
        var userId="";
        console.log("snap "+JSON.stringify(snap))
    
        snap.forEach(function (childSnapshot) {
        
            userId=childSnapshot.key;
            user=childSnapshot.val();
          
        });
        if(snap.val()===null){
            isSocialIDPresent=false;
        }
        else{
            isSocialIDPresent=true;
        }
        var userRef = admin.database().ref('user').orderByChild('email').equalTo(email);
        userRef.once('value').then(userEmailsnap=> {
            console.log("userEmailsnap "+JSON.stringify(userEmailsnap))
            userEmailsnap.forEach(function (childSnapshot) {
        
                userId=childSnapshot.key;
                user=childSnapshot.val();
              console.log("key "+childSnapshot.key+" val "+JSON.stringify(childSnapshot.val()));
            });
      
            if(userEmailsnap.val()===null){
                isEmailPresent=false;
            }
            else{
                isEmailPresent=true;
            }
            console.log("key "+userId+" val "+JSON.stringify(user));
            if(!isEmailPresent && !isSocialIDPresent){
                 status={
                    code:1,
                    msg:"User not Present"
                }
                return res.status(200).json(status);
            }
            else{
                 status={
                    code:2,
                    msg:"User Alredy Present",
                    userId:userId,
                    userData:user
                }
                return res.status(200).json(status);
            }
        }).catch(err=>{
            console.log("error in checking user email"+err);
        })
        return 0
    }).catch(err=>{
         status={
            code:0,
            msg:"Error in getting Point by Key"
        }
        console.log("err "+err)
        return res.status(400).json(status1);
       
    })
 })
/*************************************************************************************************************** */
/**Url to add points in user account 
 * data:{
	"userId":"-LCY7Pr3aIrYNGEXkfuJ",
	"type":"Post"
}
url: https://us-central1-logo-c60fc.cloudfunctions.net/addPostaddedPoint
*/
exports.adduserPoint=functions.https.onRequest((req,res)=>{
    var points=0;
    var userId=req.body.userId;
    var column=req.body.type;
  
    var pointRef=admin.database().ref('/points')
     .orderByChild('title').equalTo(column);
     pointRef.once('value').then(function(pointSnapshot) {
         
         pointSnapshot.forEach(function (childSnapshot) {

         var value = childSnapshot.val();
         points=value.points;
         console.log("Title is : " + value.points);
     });
       var userPointsData={
           "points":points,
           "userId":userId,
           "note":"User Points Added benifit of "+column
       }
       var myRef = admin.database().ref('/userpoints').push(userPointsData)
       .then((userpointSnapshot) => {
           console.log("user points added  ");
           status={
            code:1,
            msg:"user points added"
        }
        return res.status(200).json(status);
         
       }).catch(err=>{
           console.log("Error in adding user points "+err);
       });
     
       return 0
     }).catch(error=>{
     console.log("error in getting points from point table "+error)
        status={
            code:0,
            msg:"Error in user Points addition"
        }
        return res.status(400).json(status);
     });
})

/*url to add single userknows about 
data:{
	"name":"test",
	"userId":"-LCY7Pr3aIrYNGEXkfuJ"
}
url:https://us-central1-logo-c60fc.cloudfunctions.net/addUserKnowsAbout
response:
{
    "code": 1,
    "msg": "user knows About added"
}
*/

exports.addUserKnowsAbout=functions.https.onRequest((req,res)=>{
    var userKnowsAboutData={
        "knowledge":req.body.name,
        "endorsementCount":0,
        "userId":req.body.userId
       
    }
    var userknowsAboutRef = admin.database().ref('/userknowsabout')
    .push(userKnowsAboutData).then((snapshot) => {
        console.log("snapshot "+snapshot)
        var status={
            code:1,
            msg:"user knows About added"
        }
        request('https://us-central1-logos-app-915d7.cloudfunctions.net/getHighEndorcements?key='+req.body.userId, function (error, response, body) {
            if (!error && res.statusCode === 200) {
               console.log("response "+JSON.stringify(res));
            }
        })
        return res.status(200).json(status);
    }).catch(err=>{
        console.log("error in adding user Knows about "+err);
        var status={
            code:0,
            msg:"error while  user knows About"
        }
        return res.status(400).json(status);
    })
})
/*url to delete user knows about
url =https://us-central1-logo-c60fc.cloudfunctions.net/deleteUserKnowsAbout?key=-LCYXrV0bJY3RgXhpg2j   */
exports.deleteUserKnowsAbout=functions.https.onRequest((req,res)=>{
    let key=req.query.key;
    var pointRef=admin.database().ref('userknowsabout').child(key);
    pointRef.remove().then(function(snap){
       var status={
           code:1,
           msg:"userknowsabout Deleted scusseefully"
       }
       return res.status(200).json(status);
   }).catch(error=>{
       var status={
           code:0,
           msg:"Error in deleting userknowsabout"
       }
       return res.status(400).json(status);
   });
})
/******************************************************************** */
/**URL to add user opnion on perticular  statement
 * url:  https://us-central1-logos-app-915d7.cloudfunctions.net/addOpnionOnStatement
 * input :{
        "openion":1,
        "userId":"-LT6lPKpyWK47j-Y2Ea1",
        "postContentId":"-LC8bIn-FjSUPcpQUDBX"
    }
    @Author Mansi 30.05.2018
   */
exports.addOpnionOnStatement=functions.https.onRequest((req,res)=>{
    var postOpnionData={
        "openion":req.body.openion,
        "userId":req.body.userId,
        "postContentId":req.body.postContentId
    }
    var postContentRef=admin.database().ref('/postcontentreacts')
    .orderByChild("userId").equalTo(req.body.userId)
     postContentRef.once('value', function(snapshot) {
         var key="";
         snapshot.forEach(function (childSnapshot) {
             key= childSnapshot.key;
         });
         console.log("key "+key);
         if(!snapshot.exists()){
            var postcontentreactsRef = admin.database().ref('/postcontentreacts')
            .push(postOpnionData).then((postOpnionDatasnapshot) => {
                console.log("snapshot "+postOpnionDatasnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added"
                }
                addStatementpercentage(req.body.postContentId)
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon "+err);
                
            })
         }
         else{
            var postcontentreactsRef1 = admin.database().ref('/postcontentreacts').child(key)
            postcontentreactsRef1.update(postOpnionData).then((postOpnionDatasnapshot) => {
                console.log("snapshot "+postOpnionDatasnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added"
                }
                addStatementpercentage(req.body.postContentId)
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon "+err);
                
            })
         }
    }).catch(err=>{
        console.log("error in adding opinon "+err);
        var status={
            code:1,
            msg:"error while adding  Opnion"
        }
        return res.status(500).json(status);
    })
   
})
function addStatementpercentage(statementId){
    console.log("addStatementpercentage in "+statementId)
    var postsRef = admin.database().ref('/postcontentreacts')
    .orderByChild('postContentId').equalTo(statementId);
    postsRef.once('value').then(newsSnap=> {
        var agreeCount=0;
        var disagreeCount=0;
        var nuetralCount=0;
        var total=0;
        newsSnap.forEach(news => {
            total++;
           // console.log("news openion "+news.val().openion);
            var openion=parseInt(news.val().openion)
            if(openion===1){
                agreeCount++;
            }
            else if(openion===0){
                nuetralCount++;
            }
            else if(openion===2){
                disagreeCount++;
            }
        })
        var postcontentReactCoutDetailsData={
            postContentId:statementId,
            agreeCount:agreeCount,
            disagreeCount:disagreeCount,
            neutralCount:nuetralCount,
            total:total
       }
       var postContentRef=admin.database().ref('/postcontentReactCoutDetails')
       .orderByChild("postContentId").equalTo(statementId)
        postContentRef.once('value', function(snapshot) {
            var key="";
            snapshot.forEach(function (childSnapshot) {
                key= childSnapshot.key;
            });
            console.log("key "+key);
            if(!snapshot.exists()){
                
                admin.database().ref('/postcontentReactCoutDetails').push(postcontentReactCoutDetailsData)
                .then(updatedSnap=>{
                    console.log("postcontentReactCoutDetails added");
                    return 0;
                }).catch(err=>{
                    console.log("error while adding postcontentReactCoutDetails "+err);
                })
            }
            else{
                var postcontentReactCoutDetailsRef=admin.database()
                .ref('/postcontentReactCoutDetails').child(key)
                postcontentReactCoutDetailsRef.update(postcontentReactCoutDetailsData)
                .then(updatedSnap=>{
                    console.log("postcontentReactCoutDetails updated");
                    return 0;
                }).catch(err=>{
                    console.log("error while updating postcontentReactCoutDetails "+err);
                })
              
            }
         
        }).catch(err=>{
        
            console.log("error in gettin opion of statement by statement id "+err);
        
        })
        return 0;
    }).catch(err=>{
        console.log("error in updating postcontentReactCoutDetails "+err);
    })
    
      
   
}
/************************************************* */
/*URL to get statement opionon , percentage details 
input statment id
@Author Mansi 30.05.2018  */

exports.getStatementColorNCount=functions.https.onRequest((req,res)=>{
    let key=req.query.key;
    var postsRef = admin.database().ref('/postcontentreacts').orderByChild('postContentId').equalTo(key);
    postsRef.once('value').then(newsSnap=> {
        var agreeCount=0;
        var disagreeCount=0;
        var nuetralCount=0;
        var agreePercentage=0;
        var disagreePercentage=0;
        var nuetralPercentage=0;
        var total=0;
        newsSnap.forEach(news => {
            total++;
            console.log("news openion "+news.val().openion);
            var openion=parseInt(news.val().openion)
            if(openion===1){
                agreeCount++;
            }
            else if(openion===0){
                nuetralCount++;
            }
            else if(openion===2){
                disagreeCount++;
            }
        })
        agreePercentage=(agreeCount/total)*100;
        disagreePercentage=(disagreeCount/total)*100;
        nuetralPercentage=(nuetralCount/total)*100;
        console.log("max "+Math.max(agreePercentage, disagreePercentage,nuetralPercentage))
        var heighPercentage=Math.max(agreePercentage, disagreePercentage,nuetralPercentage)
        var color=0
        if (heighPercentage===agreePercentage){
            color=1;
        }
        else if (heighPercentage===nuetralPercentage){
            color=0;
        }
        else if (heighPercentage===disagreePercentage){
            color=2;
        }
        var data={
            "percentage":heighPercentage.toFixed(2),
            "color":color
        }
    return res.status(200).json(data);
    }).catch(err=>{
        console.log("error in adding opinon "+err);
        var status={
            code:1,
            msg:"error getting reactions"
        }
        return res.status(400).json(status);
    })
})

/***********************************************************************************************************************/
/* Get all posts by city name @Author subodh3344  */
exports.getCityNews = functions.https.onRequest((req,res)=>{
    console.log("Executing get city news function");

  var today    = moment().format("YYYY-MM-DDTHH:mm:ss");
  var prevDay  = moment(today).subtract(6,'day').format("YYYY-MM-DDTHH:mm:ss");
      
   var cityName    = req.body.cityName;
   var type        = req.body.type;
   var countryName = req.body.countryName;
   var countryNewsViewCount = 0;
   var checkType = false;
   if(type!==0){
       checkType = true;
   }
   console.log("****** checktype is "+checkType);
   const rootRef = admin.database().ref(); 
   // get count of total news in country in 5 days of span
   var countryNewsCountRef = rootRef.child('/posts').orderByChild('country').equalTo(countryName).once('value').then(function(cntynwsSnap){
       return new Promise((resolve,reject)=>{
           if(cntynwsSnap.val()!==null){
               var count = 0;
               console.log("got country news length is "+cntynwsSnap.numChildren());
               cntynwsSnap.forEach((post)=>{
                   count++;
                   var newsDay = moment(post.val().createdOn).format("YYYY-MM-DDTHH:mm:ss");
                   // to check if created date of news is in range of 5 day's span
                    if(moment(newsDay).isAfter(prevDay) === true){
                       countryNewsViewCount = countryNewsViewCount + post.val().views;
                    }
                    if(count === cntynwsSnap.numChildren()-1){
                       resolve();
                    }
                    return 0;
               }).catch(error=>{
                   console.log("catch of for Each");
               });
           }
          // console.log("resolving getCountry count "+countryNewsCount);
           return 0;
       });
   }).catch(error=>{
      console.log("Error in get country news count "+error);
      return true;
   });



   // db ref
  
   var postsRef =rootRef.child('/posts').orderByChild('city').equalTo(cityName);
   var list=[];
   //latitude
   postsRef.once('value').then((snap)=> {
       console.log("snap "+JSON.stringify(snap));
      var news=[];
      // functions runs after complete execution of loop 
      // to check if values present in database
      if(snap.val() !==null){
           var myFunctToRunAfter = function () {
               if(news[0].length === 0){
                    var status1={
                       code:2,
                       msg:"No Data Available",
                   //    data:news[0]
                   }
                   return res.status(200).json(status1);
               }
               else{
                    var status2={
                       code:1,
                       msg:"Got List of News",
                       data:news[0]
                   }
                   return res.status(200).json(status2);
               }
           }

           return new Promise((resolve, reject)=> {

               var count=0;
               var newsList=[];
               var totalSnapCount = 0;
               var stillUnderProcess = false;
               snap.forEach((childSnapshot)=> {
                   var newsDay = moment(childSnapshot.val().createdOn).format("YYYY-MM-DDTHH:mm:ss");
                  // to check if created date of news is in range of 5 day's span
                  console.log("in foreach "+newsDay+" prevDay "+prevDay+" is after "+moment(newsDay).isAfter(prevDay));
                //   if(moment(newsDay).isAfter(prevDay) === true){
                       totalSnapCount++;
                       stillUnderProcess = true;
                       
                       console.log("count is "+count+" newz count "+snap.numChildren());
                       var userID=childSnapshot.val().userId;
                       var userRef = admin.database().ref('/user').child(userID);
                       userRef.once('value').then((userSnap)=> {
                           console.log("in userSnap ");
                           var userDetails=userSnap.val()
                           var newsId=childSnapshot.key
                           /*  Query to Get news L-R count from newslrcount table by newsId  */
                           var newsLRRef = admin.database().ref('/newslrcount').orderByChild('newsId').equalTo(newsId);
                           newsLRRef.once('value').then((newsLRCountSnap)=> {
                               var total=0;
                               var lrCOunt=0;
                               var avg = 0;
                               newsLRCountSnap.forEach(news => {
                        //           console.log("news each"+news.val().lRcount);
                                   total++;
                                   lrCOunt=lrCOunt +parseInt(news.val().lRcount);
                               });
                          //     console.log("lrcount "+lrCOunt)
                               if(lrCOunt !==0){
                                   avg=(lrCOunt/total)
                               }
                               /* Query to get postreacts for perticular news by news Id */
                               var agreeRef = admin.database().ref('/postreacts').orderByChild('postId').equalTo(newsId);
                               agreeRef.once('value').then((agreeSnap)=> {
                                   var agreeCount=0;
                                   var disagreeCount=0;
                                   var nuetralCount=0;
                                   agreeSnap.forEach(news => {
                                       var openion=parseInt(news.val().openion)
                                       if(openion===1){
                                           agreeCount++;
                                       }
                                       else if(openion===0){
                                           nuetralCount++;
                                       }
                                       else if(openion===2){
                                           disagreeCount++;
                                       }
                                   })
                                
                                    if(checkType === true){
                                       if(childSnapshot.val().type === type){
                                        count++;
                                           var news1={
                                               user:userDetails,
                                               news:childSnapshot,
                                               newsId:childSnapshot.key,
                                               newsLRCount:avg,
                                               agreeCount:agreeCount,
                                               disagreeCount:disagreeCount,
                                               neutralCount:nuetralCount,
                                               countryNewsViewCount :countryNewsViewCount
                                           }
                                           newsList.push(news1);
                                       }
                                       else{
                                        count++;
                                           console.log("Type is different");
                                       }
                                      }
                                      else{
                                        count++;
                                       var news2={
                                           user:userDetails,
                                           news:childSnapshot,
                                           newsId:childSnapshot.key,
                                           newsLRCount:avg,
                                           agreeCount:agreeCount,
                                           disagreeCount:disagreeCount,
                                           neutralCount:nuetralCount,
                                           countryNewsViewCount :countryNewsViewCount
                                       }
                                       newsList.push(news2)
                                      }
                                     stillUnderProcess = false;
                                     if(checkType){
                                        if(count===snap.numChildren()){
                                            console.log("resolving function");
                                            news.push(newsList)
                                            resolve(myFunctToRunAfter());
                                        }
                                       }
                                       else{
                                        if(newsList.length===snap.numChildren()){
                                            console.log("resolving function");
                                            news.push(newsList)
                                            resolve(myFunctToRunAfter());
                                        }
                                       }
                                     
                                       return 0
                                  
                                   // agreeCatch
                               }).catch(err=>{
                                   console.log("agree err "+err);
                               })
                               return 0;
                               // newsLR REf Catch
                           }).catch(err=>{
                               console.log("newsLR err "+err);
                           })
                           return 0
                           // userRef Catch    
                       }).catch(err=>{
                           console.log("userRef err "+err);
                       })
                })
           })
       }
       else{
           console.log("Got empty data");
           var status={
               code:2,
               msg:"No Data Available"
           }
           return res.status(400).json(status);
       }
   }).catch(error=>{
       console.log("in error of  postsRef.once('value') : "+JSON.stringify(error));
       var status={
           code:2,
           msg:"No Data Found wewe"
       }
       return res.status(400).json(status);
   });
});

/************************************************************************************
 * Functions to add user opinion on news
 * input:UserId,NewsId,Opinion 
 * @Author Mansi 31.05.2018
 * url=https://us-central1-logos-app-915d7.cloudfunctions.net/addOpnionOnNews
 */
exports.addOpnionOnNews=functions.https.onRequest((req,res)=>{
    var postOpnionData={
        "openion":req.body.openion,
        "userId":req.body.userId,
        "postId":req.body.postId
    }
    var postContentRef=admin.database().ref('/postreacts')
    .orderByChild("userId").equalTo(req.body.userId)
     postContentRef.once('value', function(snapshot) {
         var key="";
         snapshot.forEach(function (childSnapshot) {
             key= childSnapshot.key;
         });
         console.log("key "+key);
         if(!snapshot.exists()){
            var postcontentreactsRef = admin.database().ref('/postreacts')
            .push(postOpnionData).then((postOpnionDatasnapshot) => {
                console.log("snapshot "+postOpnionDatasnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added on News"
                }
               
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon on News"+err);
                
            })
         }
         else{
            var postcontentreactsRef1 = admin.database().ref('/postreacts').child(key)
            postcontentreactsRef1.update(postOpnionData).then((postOpnionDatasnapshot) => {
                console.log("snapshot "+postOpnionDatasnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added on News"
                }
             
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon on News"+err);
                
            })
         }
    }).catch(err=>{
        console.log("error in adding opinon on News"+err);
        var status={
            code:1,
            msg:"error while adding  Opnion on News"
        }
        return res.status(500).json(status);
    })
   
})


/************************************************************************************
 * Functions to add user L-R count  on news
 * input:UserId,NewsId,L-R count value 
 * @Author Mansi 31.05.2018
 * url=https://us-central1-logos-app-915d7.cloudfunctions.net/addLRCountOnNews
 */
exports.addLRCountOnNews=functions.https.onRequest((req,res)=>{
    var lrCountData={
        "lRcount":req.body.lRcount,
        "userId":req.body.userId,
        "newsId":req.body.postId
    }
    var newslrcounttRef=admin.database().ref('/newslrcount')
    .orderByChild("userId").equalTo(req.body.userId)
    newslrcounttRef.once('value', function(snapshot) {
         var key="";
         snapshot.forEach(function (childSnapshot) {
             key= childSnapshot.key;
         });
         console.log("key "+key);
         if(!snapshot.exists()){
            var newslrcountreactsRef = admin.database().ref('/newslrcount')
            .push(lrCountData).then((newslrcountreacsnapshot) => {
                console.log("snapshot "+newslrcountreacsnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added on News"
                }
               
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon on News"+err);
                
            })
         }
         else{
            var newslrcountreactsRef1 = admin.database().ref('/newslrcount').child(key)
            newslrcountreactsRef1.update(lrCountData).then((newslrcountreacsnapshot) => {
                console.log("snapshot "+newslrcountreacsnapshot)
                var status={
                    code:1,
                    msg:"user Opnion added on News"
                }
             
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon on News"+err);
                
            })
         }
    }).catch(err=>{
        console.log("error in adding opinon on News"+err);
        var status={
            code:1,
            msg:"error while adding  Opnion on News"
        }
        return res.status(500).json(status);
    })
   
})
/****************************************************************************
 * function to report a news
 * @Author Mansi 01.06.2018
 * Input userId, newsId ,note 
 */

exports.reportNews=functions.https.onRequest((req,res)=>{
   
  
  var reportNewsData={
        "note":req.body.note,
        "userId":req.body.userId,
        "newsId":req.body.postId
    }
    
    console.log("req.body "+req.body.userId);
    var newsId=req.body.postId;
  
    var url='/posts/'+req.body.postId
    console.log("url "+url);
    var postRef=admin.database().ref(url)
    postRef.update({"isReported": 1}).then(postSnap=>{
        console.log("snap "+JSON.stringify(postSnap))
        var postreporttRef=admin.database().ref('/postreport')
        .orderByChild("userId").equalTo(req.body.userId)
        postreporttRef.once('value', function(snapshot) {
            var key="";
            snapshot.forEach(function (childSnapshot) {
                key= childSnapshot.key;
            });
            console.log("key "+key);
            if(!snapshot.exists()){
                var postreporttRef1 = admin.database().ref('/postreport')
                .push(reportNewsData).then((postReportsnapshot) => {
                    console.log("snapshot "+postReportsnapshot)
                    var status={
                        code:1,
                        msg:"News Reported Successfully"
                    }
                
                    return res.status(200).json(status);
                }).catch(err=>{
                    console.log("error in Report news"+err);
                    
                })
            }
            else{
                var postreporttRef2 = admin.database().ref('/postreport').child(key)
                postreporttRef2.update(reportNewsData).then((postReportsnapshot) => {
                    console.log("snapshot "+postReportsnapshot)
                    var status={
                        code:1,
                        msg:"News Reported Successfully"
                    }
                
                    return res.status(200).json(status);
                }).catch(err=>{
                    console.log("error in Report news"+err);
                    
                })
            }
        }).catch(err=>{
            console.log("erro in Report news"+err);
            var status={
                code:1,
                msg:"erro in Report news"
            }
            return res.status(500).json(status);
        })
        return 0;
    }).catch(err=>{
        console.log("erro in getting news by news Id "+err);
        var status={
            code:1,
            msg:"erro in Report news "
        }
        return res.status(500).json(status);
    })
   
})
/*********************************************************************************** */
/**url to add comments to main news in database 
 * @Author mansi 07.06.2018
 * input : comments,newsId,UserId,opinion
 * url : https://us-central1-logos-app-915d7.cloudfunctions.net/addNewsComments
 */
exports.addNewsComments=functions.https.onRequest((req,res)=>{
    var commentsData={
        "comments":req.body.comments,
        "deletedByAdmin":0,
        "deletedReason":"",
        "isDeleted":0,
        "isReported":0,
        "openion":parseInt(req.body.openion),
        "userId":req.body.userId,
        "postId":req.body.postId,
        "isEdited":0
    }
    var postcommentstRef=admin.database().ref('/postcomments')
    .orderByChild("userId").equalTo(req.body.userId)
    postcommentstRef.once('value', function(snapshot) {
         var key="";
         var value="";
         snapshot.forEach(function (childSnapshot) {
             key= childSnapshot.key;
              value=childSnapshot.val();
             console.log("value "+JSON.stringify(value));
         });
         console.log("key "+key);
         console.log("postid "+value.postId);
         if(!snapshot.exists()){
            var postcommentstRef1 = admin.database().ref('/postcomments')
            .push(commentsData).then((postCommentsnapshot) => {
                console.log("snapshot "+postCommentsnapshot)
                
                var status={
                    code:1,
                    msg:"Comment Added Successfully"
                }
                sendCommentNotification(req.body.postId,req.body.userId);
                addUserPointAfterCommentsOrReply(req.body.userId,"Comment");
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("error in adding opinon on News"+err);
                
            })
         }
         else{
            if (req.body.postId !== value.postId){
                var postcommentstRef3= admin.database().ref('/postcomments')
                .push(commentsData).then((postCommentsnapshot) => {
                    console.log("snapshot "+postCommentsnapshot)
                    var status={
                        code:1,
                        msg:"Comment Added Successfully"
                    }
                    sendCommentNotification(req.body.postId,req.body.userId);
                    addUserPointAfterCommentsOrReply(req.body.userId,"Comment",req);
                    return res.status(200).json(status);
                   
                }).catch(err=>{
                    console.log("error in adding opinon on News"+err);
                    
                })
            }
            else{
                var postcommentstRef2 = admin.database().ref('/postcomments').child(key)
                postcommentstRef2.update(commentsData).then((postCommentsnapshot) => {
                    console.log("snapshot "+postCommentsnapshot)
                    var status={
                        code:1,
                        msg:"Comment Added Successfully"
                    }
                    sendCommentNotification(req.body.postId,req.body.userId);
                    addUserPointAfterCommentsOrReply(req.body.userId,"Comment");
                    return res.status(200).json(status);
                   
                }).catch(err=>{
                    console.log("error in adding comments"+err);
                    
                })
            }
         }
    }).catch(err=>{
        console.log("error in adding comments"+err);
                
        var status={
            code:0,
            msg:"error while adding  Comment on News"
        }
        return res.status(500).json(status);
    })

})
function sendCommentNotification(postId,userId){
    console.log("in sendCommentNotification");
    var postRef=admin.database().ref('posts').child(postId)
    postRef.once('value').then((postSanp)=>{
        var postDetails=postSanp.val();
        console.log("postDetails "+JSON.stringify(postDetails));
        var userRef = admin.database().ref('/user').child(postDetails.userId);
        userRef.once('value').then((userSnap)=> {
            console.log("send notification"+JSON.stringify(userSnap.val()));
         
            sendNoti(postDetails.userId,userSnap.val().APNToken,"Comment",2,userId);
            return 0;
        }).catch(err=>{
            console.log("err in user details "+err)
            return 0
        })
        return 0;
    })
    .catch(err=>{
        console.log("err in getting post id from comment "+err)
    })
   
}

/************************************************************************************** */
/** url to get all comment's replies 
 * input : post ID 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getRepliesOfComments?key=-LEOIfj4hYUm-sLX3S-J
 */

exports.getRepliesOfComments = functions.https.onRequest((req,res)=>{
    var commentId = req.query.key;
    var finalRepliesArray = [];
    var replyRef=admin.database().ref('/commentsonpostcomments').orderByChild('commentId').equalTo(commentId);
    replyRef.once('value',(repliesSnap)=>{
        if(repliesSnap.exists()){
            var finalFunction = function(){
                var status = {
                    code : 1,
                    msg : "Got replies",
                    data : finalRepliesArray
                }
                return res.status(200).json(status);
            }

            return new Promise((resolve,reject)=>{
                 repliesSnap.forEach((reply)=>{
                    console.log("reply.val().userId is "+reply.val().userId); 
                    var userRef=admin.database().ref('/user').child(reply.val().userId);
                    userRef.once('value',(replyUserSnap)=>{
                        console.log("replyUserSnap is "+JSON.stringify(replyUserSnap));
                        var replyData = {
                            userId : replyUserSnap.key,
                            user : replyUserSnap,
                            replyId : reply.key,
                            reply : reply
                        }
                        finalRepliesArray.push(replyData);
                        if(finalRepliesArray.length === repliesSnap.numChildren()){
                            resolve(finalFunction());
                        }
                    })
                 })
            });
        }
        else{
            var status = {
                code : 0,
                msg : "No replies Found"
            }
            return res.status(200).json(status);
        }
    }).catch((err)=>{
        console.log("In error of get replies of comments "+JSON.stringify(err));
    });
});



/************************************************************************************** */
/** url to get all post's comments 
 * input : post ID 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getAllCommentsByNewsId?key=-LE8BPFsR9AN09f0HdI6
 */

exports.getAllCommentsByNewsId = functions.https.onRequest((req,res)=>{
    var newsId = req.query.key;
    var finalCommentsArray = [];
    var getCommentsRef = admin.database().ref('/postcomments').orderByChild('postId').equalTo(newsId);
    getCommentsRef.once('value',(gotCommentsSnap)=>{
        if(gotCommentsSnap.exists()){
            var finalFunction = function(){
                var status = {
                    code :1,
                    msg : "Got Comments",
                    data : finalCommentsArray
                }
                return res.status(200).json(status);
            }
            var isProccessing = false;
            return new Promise((resolve,reject)=>{
                var counter = 0;
                gotCommentsSnap.forEach((comment)=>{
                    isProccessing = true;
                    counter++;
                    //console.log("comment is "+JSON.stringify(comment));
                    var userRef=admin.database().ref('/user').child(comment.val().userId);
                    userRef.once('value',(userSnap)=>{
                       // console.log("got user "+JSON.stringify(userSnap));
                        var commentsData = {
                            userId : userSnap.key,
                            user : userSnap,
                            commentId : comment.key,
                            comment : comment
                        }
                        finalCommentsArray.push(commentsData);
                        isProccessing = false;
                        if(gotCommentsSnap.numChildren() === finalCommentsArray.length){
                           if(!isProccessing){
                                console.log("resolving...");
                                resolve(finalFunction());
                            }
                        }
                        
                    }).catch((err)=>{
                        console.log("got error while etch user in getReplies "+JSON.stringify(err));
                        return res.status(400);
                    })
                });
            });

           
            
           //console.log("got response from getReplies "+JSON.stringify(userData));
        }
        else{
            var status = {
                code : 0,
                msg : "No comments found"
            };
            return res.status(200).json(status);
        }
    }).catch(err=>{
        var status = {
            code : 0,
            msg : "Error occured while get Comments of News"
        }
        console.log("error in getting comment list "+err)
        return res.status(500).json(status);
        
    })
});


    exports.getAllCommentsByNewsIdOld=functions.https.onRequest((req,res)=>{
        var newsId=req.query.key;
        //const rootRef = admin.database().ref();
        console.log("key "+newsId);
        var commentsProcess = false;
        var replyDataProcess = false; 
        var comments = [];
        var postCommentsRef = admin.database().ref('/postcomments').orderByChild('postId').equalTo(newsId);
        postCommentsRef.once('value',(commentsDataSnap)=> {
         
          if(commentsDataSnap.exists()){
               var finalReturnFunctions = function () {
                    console.log("comments "+JSON.stringify(comments));
                    var status={
                        code:1,
                        msg:"Comments Details",
                        data:comments
                    }
                    console.log("commentsProcess is "+commentsProcess+" replyDataProcess" +replyDataProcess);
                    if(!commentsProcess && !replyDataProcess){
                        console.log("returning value");
                        return res.status(200).json(status);
                    }
                }

                return new Promise((resolveCommentProc,rejectCommentProc)=>{
                    var commentsCount = 0;
                   // counter on comments 
                   commentsDataSnap.forEach((comment)=>{
                        commentsCount++;
                        commentsProcess = true;
                        console.log("*************** making commetnsProcess TRUE");
                        console.log("comments :: "+JSON.stringify(comment));
                       
                    })
                });

            
           }
           else{
               console.log("commentsData not exist");
                var status={
                    code:0,
                    msg:"No comments for this post availables"
                }
                return res.status(204).json(status);
           }
         
        }).catch(err=>{
            var status = {
                code : 0,
                msg : "Error occured while get Comments of News"
            }
            console.log("error in getting comment list "+err)
            return res.status(500).json(status);
            
        })
    })
    
/***************************************************************************
 * url to report comment
 * input comment id, note ,userId
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/reportComment
 * @Author Mansi 14.06.2018
 */

exports.reportComment=functions.https.onRequest((req,res)=>{
   
  
    var reportNewsData={
          "note":req.body.note,
          "reportedByUserId":req.body.reportedByUserId,
          "commentId":req.body.commentId
      }
      
      console.log("req.body "+req.body.reportedByUserId);
      var commentIdBYres=req.body.commentId;
    
      var url='/postcomments/'+req.body.commentId
      console.log("url "+url);
      var postRef=admin.database().ref('postcomments').child(req.body.commentId)
      postRef.update({"isReported": 1}).then(postSnap=>{
          
            console.log("snap "+JSON.stringify(postSnap))
          var postreporttRef=admin.database().ref('/commentreport')
          .orderByChild("reportedByUserId").equalTo(req.body.reportedByUserId)
          postreporttRef.once('value', function(snapshot) {
              console.log("snapshot "+JSON.stringify(snapshot));
              var key="";
              var CommentId="";
              snapshot.forEach(function (childSnapshot) {
                  key= childSnapshot.key;
                  CommentId=childSnapshot.val().commentId
              });
              if(!snapshot.exists()){
                  var postreporttRef1 = admin.database().ref('/commentreport')
                  .push(reportNewsData).then((postReportsnapshot) => {
                      var status={
                          code:1,
                          msg:"Comments Reported Successfully"
                      }
                  
                      return res.status(200).json(status);
                  }).catch(err=>{
                      console.log("error in Report news"+err);
                      
                  })
              }
              else{
                  if(CommentId !== commentIdBYres){
                    var postreporttRef3 = admin.database().ref('/commentreport')
                    .push(reportNewsData).then((postReportsnapshot) => {
                        console.log("snapshot "+postReportsnapshot)
                        var status={
                            code:1,
                            msg:"Comments Reported Successfully"
                        }
                    
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("error in Report news"+err);
                        
                    })
                  }
                  else{
                    var postreporttRef2 = admin.database().ref('/commentreport').child(key)
                    postreporttRef2.update(reportNewsData).then((postReportsnapshot) => {
                        console.log("snapshot "+postReportsnapshot)
                        var status={
                            code:1,
                            msg:"Comments Reported Successfully"
                        }
                     
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("error in Report news"+err);
                        
                    })
                  }
              }
          }).catch(err=>{
              console.log("erro in Report Comments"+err);
              var status={
                  code:1,
                  msg:"erro in Report Comments"
              }
              return res.status(500).json(status);
          })
     
          return 0;
      }).catch(err=>{
          console.log("erro in getting news by news Id "+err);
          var status={
              code:1,
              msg:"erro in Report Comments "
          }
          return res.status(500).json(status);
      })
     
  })

  /*****************************************************************************************
   * url to add reply on comment
   * input: comment id, comment ,opinion ,user id
   * @Author Mansi 14.06.2018
   * url: https://us-central1-logos-app-915d7.cloudfunctions.net/addReplyOnComment
   * data"{
          "comments":"uuu",
          "userId":"-LCs9UnX5qiVhChsoudY",
          "commentId":"-LEOIfj4hYUm-sLX3S-O"
}
      
   */
exports.addReplyOnComment=functions.https.onRequest((req,res)=>{
    var replyData=
    {
        "commentId" : req.body.commentId,
        "comments" :req.body.comments,
        "deletedByAdmin" : 0,
        "isDeleted" : 0,
        "openion" : 0,
        "reason" : "",
        "isEdited":0,
        "userId" : req.body.userId
      }
      var replyRef=admin.database().ref('/commentsonpostcomments')
      .orderByChild("userId").equalTo(req.body.userId)
      replyRef.once('value', function(snapshot) {
        if(snapshot.exists()){
            var key="";
            var CommentId="";
            var isPush=true;
            snapshot.forEach(function (childSnapshot) {
                key= childSnapshot.key;
                CommentId=childSnapshot.val().commentId
                if(CommentId === req.body.commentId){
                    var commentsonpostcommentsRef2 = admin.database().ref('/commentsonpostcomments').child(key)
                    commentsonpostcommentsRef2.update(replyData).then((commentsonpostcommentssnapshot) => {
                        console.log("commentsonpostcommentssnapshot "+commentsonpostcommentssnapshot)
                        var status={
                            code:1,
                            msg:"Reply Added Successfully"
                        }
                        sendreplyNotification(req.body.commentId,req.body.userId);
                        addUserPointAfterCommentsOrReply(req.body.userId,"Reply")
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("error in add reply"+err);
                        
                    })
                }
                else{
                    admin.database().ref('/commentsonpostcomments').push(replyData)
                    .then(replySnap=>{
                        console.log("replySnap "+JSON.stringify(replySnap));
                        var status={
                            code:1,
                            msg:"Reply Added Successfully"
                        }
                        sendreplyNotification(req.body.commentId,req.body.userId);
                        addUserPointAfterCommentsOrReply(req.body.userId,"Reply")
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("err in adding reply "+err);
                    })
                }
            
            });
        }
        else{
           
            admin.database().ref('/commentsonpostcomments').push(replyData)
            .then(replySnap=>{
                console.log("replySnap "+JSON.stringify(replySnap));
                var status={
                    code:1,
                    msg:"Reply Added Successfully"
                }
                sendreplyNotification(req.body.commentId,req.body.userId);
                addUserPointAfterCommentsOrReply(req.body.userId,"Reply")
                return res.status(200).json(status);
            }).catch(err=>{
                console.log("err in adding reply "+err);
            })
        }
        

      }).catch(err=>{
          console.log("error in getting reply by user Id"+err);
      })
})

function sendreplyNotification(commentId,userId){
    console.log("in sendreplyNotification");
    var postRef=admin.database().ref('postcomments').child(commentId)
    postRef.once('value').then((postSanp)=>{
        var postDetails=postSanp.val();
        console.log("postDetails "+JSON.stringify(postDetails));
        var userRef = admin.database().ref('/user').child(postDetails.userId);
        userRef.once('value').then((userSnap)=> {
            console.log("send notification"+JSON.stringify(userSnap.val()));
         
            sendNoti(postDetails.userId,userSnap.val().APNToken,"Comment",2,userId);
            return 0;
        }).catch(err=>{
            console.log("err in user details "+err)
            return 0
        })
        return 0;
    })
    .catch(err=>{
        console.log("err in getting post id from comment "+err)
    })
   
}


/**************************************************************************************************
 * url to endorse the skills 
 * input user id ,skills id 
 * @Author Mansi 21.06.2018
 */
exports.endorseUser=functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var endorsementId=req.body.endorsementId;
    console.log("userId "+userId);
    console.log("endorsementId "+endorsementId);
    var data={
        endorsmentID:endorsementId,
        EndorsFromUserId:userId
    }
    return admin.database().ref('/userEndorsedTo').push(data).then((snapshot) => {
        
        var status={
            code:1,
            //msg:"Endorsed  scusseefully"
            msg:"Endorsed successfully"
        }
        updateEndorsment(endorsementId,1,userId);
        return res.status(200).json(status);
      }).catch(err=>{
        console.log("eror"+err)
        var status={
            code:0,
            msg:"Error in Endorsed"
        }
        return res.status(400).json(status);
      });
})

function updateEndorsment(endorsementId,type,userId){
    console.log("endorsementId "+endorsementId +" type "+type + " userId "+userId);
    var userref = admin.database().ref('userknowsabout')
    .child(endorsementId)
    userref.once('value').then(function(snap) {
        console.log("snap "+JSON.stringify(snap));
        //type 1:increment endorsment Count 
        // type 0:decrement endorsment Count
        var points=0;
        var msg="Endorsed Your Skills";
        var notificationType=0;
        if (type === 1){
            notificationType=3;
         
             points=parseInt(snap.val().endorsementCount)+1;
        console.log("points "+points);
        }
        else if (type === 0){
             points=parseInt(snap.val().endorsementCount)-1;
            console.log("points "+points);
            notificationType=4;
          
        }
        var url='/userknowsabout/'+endorsementId
        console.log("url "+url);
        var postRef=admin.database().ref('userknowsabout').child(endorsementId)
        postRef.update({"endorsementCount": points}).then(postSnap=>{
            console.log("postSnap "+JSON.stringify(postSnap));
            var userRef = admin.database().ref('/user').child(snap.val().userId);
            userRef.once('value').then((userSnap)=> {
                console.log("send notification"+JSON.stringify(userSnap.val()));
             
                sendNoti(snap.val().userId,userSnap.val().APNToken,msg,notificationType,userId);
                return 0;
            }).catch(err=>{
                console.log("err in user details "+err)
                return 0
            })
            request('https://us-central1-logos-app-915d7.cloudfunctions.net/getHighEndorcements?key='+snap.val().userId, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                   console.log("response "+JSON.stringify(response));
                }
            })
            
            return 0
        }).catch(err=>{
            console.log("error in updating count "+err);
        })
        return 0
    }).catch(err=>{
        console.log("error in getting endorsment by ID "+err)
    })
}

/***********************************************************************
 * url to get news opinoion array 
 * input :news ID
 * output : array of opinion id
 * url :https://us-central1-logos-app-915d7.cloudfunctions.net/getNewsOpinionByNewsId?key=-LE8BPFsR9AN09f0HdI6
 * @Author Mansi 18.06.2018
 */
exports.getNewsOpinionByNewsId = functions.https.onRequest((req,res)=>{
    var newsId=req.query.key;
    console.log("newsId "+newsId);
    var newsOpinion=[]
    var count=0;
    var newsOpinioref = admin.database().ref('postreacts').orderByChild('postId').equalTo(newsId);
    newsOpinioref.once('value').then(function(snap) {
        console.log("snap "+JSON.stringify(snap));
        if(snap.exists()){
            var myFunctToRunAfter = function () {
                var status={
                    code:1,
                    msg:"opinion on news Details",
                    data:newsOpinion
                }
                return res.status(200).json(status);
            }
            return new Promise((resolve, reject)=> {
                snap.forEach(newsopinion=>{
                    count++;
                    var userID=newsopinion.val().userId;
                    var userRef = admin.database().ref('/user').child(userID);
                    userRef.once('value').then(function(userSnap) {
                        var data={
                            userlatitude:userSnap.val().latitude,
                            userlongitude:userSnap.val().longitude,
                            userId:userSnap.key,
                            opinion:newsopinion.val().openion
                        }
                        newsOpinion.push(data);
                        if(newsOpinion.length === count){
                            resolve(myFunctToRunAfter());
                        }
                        return 0;
                    }).catch(err=>{
                        console.log("Error in getting user details "+err);
                    })
                })
            })
        }
        else{
            var status={
                code:0,
                msg:"no opinion present for given news ID"
            }
            return res.status(503).json(status);
        }
      
    }).catch(err=>{

        console.log("error in getting news opinion by news id "+err);
        var status={
            code:0,
            msg:"error in getting news opinion"
        }
        return res.status(400).json(status);
    })
})

/***********************************************************************
 * url to get  opinoion on statement  array 
 * input :statment  ID
 * output : array of opinion id
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getNewsStatementOpinionByNewsId?key=-LC8bIn-FjSUPcpQUDBX
 * @Author Mansi 18.06.2018
 */
exports.getNewsStatementOpinionByNewsId = functions.https.onRequest((req,res)=>{
    var statmentntId=req.query.key;
    console.log("newsId "+statmentntId);
    var newsOpinion=[]
    var count=0;
    var newsOpinioref = admin.database().ref('postcontentreacts')
    .orderByChild('postContentId').equalTo(statmentntId);
    newsOpinioref.once('value').then(function(snap) {
        console.log("snap "+JSON.stringify(snap));
        if(snap.exists()){
            var myFunctToRunAfter = function () {
                var status={
                    code:1,
                    msg:"opinion on news Statments Details",
                    data:newsOpinion
                }
                return res.status(200).json(status);
            }
            return new Promise((resolve, reject)=> {
                snap.forEach(newsopinion=>{
                    count++;
                    var userID=newsopinion.val().userId;
                    var userRef = admin.database().ref('/user').child(userID);
                    userRef.once('value').then(function(userSnap) {
                        var data={
                            userlatitude:userSnap.val().latitude,
                            userlongitude:userSnap.val().longitude,
                            userId:userSnap.key,
                            opinion:newsopinion.val().openion
                        }
                        newsOpinion.push(data);
                        if(newsOpinion.length === count){
                            resolve(myFunctToRunAfter());
                        }
                        return 0;
                    }).catch(err=>{
                        console.log("Error in getting user details "+err);
                    })
                })
            })
        }
        else{
            var status={
                code:0,
                msg:"no opinion present for given Statment ID"
            }
            return res.status(503).json(status);
        }
      
    }).catch(err=>{

        console.log("error in getting news opinion by statment id "+err);
        var status={
            code:0,
            msg:"error in getting news opinion"
        }
        return res.status(400).json(status);
    })
})

/*********************************************************************************
 * url to get user activity  info by user id
 * input: userId 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getUserActivityById?key=-LCs9UnX5qiVhChsoudZ
 * @Author Mansi 20.06.2018
 */
exports.getUserActivityById = functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var activityArray=[];
    var useActivityref = admin.database().ref('posts')
        .orderByChild('userId').equalTo(userId);
        useActivityref.once('value').then(function(activitySnap) {
            console.log("activitySnap "+JSON.stringify(activitySnap));
            if(activitySnap.exists()){
                activitySnap.forEach(activity=>{
                    var data={
                        endorspostIdmentId:activity.key,
                        postTitle:activity.val().title,
                        postViews:activity.val().views
                    }
                    activityArray.push(data);
                    activityArray.sort(function(a, b) {
                        return parseFloat(b.postViews) - parseFloat(a.postViews);
                    });
                })
                var status={
                    code:1,
                    msg:"Activity for user",
                    data:activityArray
                  
                }
                return res.status(200).json(status);
            }
            else{
                var status1={
                    code:0,
                    msg:"No Activity found for user",
                  
                }
                return res.status(200).json(status1);
            }
           
        }).catch(err=>{
            
            console.log("Error in getting user's activity "+err);
            var status={
                code:0,
                msg:"No user found",
              
            }
            return res.status(500).json(status);
        })
})

/*********************************************************************************
 * url to get user info by user id
 * input: userId 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getUserById?key=-LFN623dPlQ2FRPc2Kau
 * @Author Mansi 19.06.2018
 */
exports.getUserById = functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var userref = admin.database().ref('user')
    .child(userId)
    userref.once('value').then(function(snap) {
        console.log("user snap "+JSON.stringify(snap));
        var lives="From "+snap.val().city+", "+snap.val().country;
        var cred=[]
        
        var userpointoref = admin.database().ref('userpoints')
        .orderByChild('userId').equalTo(userId);
        userpointoref.once('value').then(function(pointSnap) {
            console.log("point s "+JSON.stringify(pointSnap));
            var userpoint=0;
            pointSnap.forEach(point=>{
                var points=point.val().points;
                userpoint=userpoint+points
            })
            console.log("user final points "+userpoint);
            var userknowsAboutref = admin.database().ref('usercreadentials')
            .orderByChild('userId').equalTo(userId);
            userknowsAboutref.once('value').then(function(credSnap) {
                if(credSnap.exists()){
                    //type 0:educational 1:Experience 2:City and Country 3:languages
                    credSnap.forEach(usercr=>{
                        var data={
                            type:usercr.val().type,
                            name:usercr.val().creadentials,
                            id:usercr.key
                        }
                        cred.push(data);
                    })
                } 
                var userlangref = admin.database().ref('userLanguages')
                .orderByChild('userId').equalTo(userId);
                userlangref.once('value').then(function(langSnap) {
                    finallang="";
                    var lang="NA"
                   if(langSnap.exists()){
                    langSnap.forEach(lang=>{
                        finallang=finallang+","+lang.val().
                        name;
                    })
                   }
                   else{
                    lang="NA"
                   }
                    finallang=finallang.substring(1);
                    var data={
                        type:3,
                        name:lang,
                        id:"0"
                    }
                    cred.push(data);
                    var livesData={
                        type:2,
                        name:lives,
                        id:"NA"
                    }
                    cred.push(livesData);
                    var userSubscriberref = admin.database().ref('userSubscription')
                    .orderByChild('subscribeTo').equalTo(userId);
                    userSubscriberref.once('value').then(function(subSnap) {
                        console.log("subSnap "+JSON.stringify(subSnap));
                        var subpoints=0;
                        if(subSnap.exists()){
                            subSnap.forEach(sub=>{
                                subpoints=subpoints+1;
                            })
                            var userData={
                                userId:userId,
                                userName:snap.val().name,
                                city:snap.val().city,
                                country:snap.val().country,
                                currentCity:snap.val().currentCity,
                                currentCountry:snap.val().currentCountry,
                                userpoints:userpoint,
                                userCredDetails:cred,
                                userEndorsment:snap.val().highEndorsmentName,
                                userProfile:snap.val().photo,
				politicalOrientation:snap.val().politicalOrientation,
                                userSubscribers:subpoints
                               
                            }
                            var status={
                                code:1,
                                msg:"User Data",
                                data:userData
                            }
                            return res.status(200).json(status);
                        }
                        else{
                            subpoints=0;
                            var userData1={
                                userId:userId,
                                userName:snap.val().name,
                                city:snap.val().city,
                                country:snap.val().country,
                                currentCity:snap.val().currentCity,
                                currentCountry:snap.val().currentCountry,
                                userpoints:userpoint,
                                userCredDetails:cred,
                                userEndorsment:snap.val().highEndorsmentName,
                                userProfile:snap.val().photo,
				politicalOrientation:snap.val().politicalOrientation,
                                userSubscribers:subpoints
                            }
                            var status1={
                                code:1,
                                msg:"User Data",
                                data:userData1
                            }
                            return res.status(200).json(status1);
                        }
                       
                       
                    }).catch(err=>{
                        console.log("Error in getting user subscriber "+err);
                    })
                    return 0;
                }).catch(err=>{
                    console.log("Error in getting user's language details"+err );
                })
                return 0;
            }).catch(err=>{
                console.log("error in getting users credentials details "+err);
            })
            return 0;
        }).catch(err=>{
            console.log("error in getting user's point "+err);
        })
        return 0;
    }).catch(err=>{
        console.log("error in getting usrr info "+err)
        var status={
            code:0,
            msg:"No user found",
          
        }
        return res.status(500).json(status);
    })
})

/*********************************************************************************
 * url to get user endorsments  info by user id
 * input: userId 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getUserEndorsmentsById?key=-LFN623dPlQ2FRPc2KaC
 * @Author Mansi 20.06.2018
 */
exports.getUserEndorsmentsById = functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var endorsments=[];
    var userEndorsmentsref = admin.database().ref('userknowsabout')
        .orderByChild('userId').equalTo(userId);
        userEndorsmentsref.once('value').then(function(skillsSnap) {
            console.log("skillsSnap "+JSON.stringify(skillsSnap));
            if(skillsSnap.exists()){
                skillsSnap.forEach(skills=>{
                    var data={
                        endorsmentId:skills.key,
                        endorsmentData:skills.val()
                    }
                    endorsments.push(data);
                    endorsments.sort(function(a, b) {
                        return parseFloat(b.endorsmentData.endorsementCount) - parseFloat(a.endorsmentData.endorsementCount);
                    });
                })
                var status={
                    code:1,
                    msg:"Endorsments for user",
                    data:endorsments
                  
                }
                return res.status(200).json(status);
            }
            else{
                var status1={
                    code:0,
                    msg:"No Endorsments found for user",
                  
                }
                return res.status(500).json(status1);
            }
          
        }).catch(err=>{
            console.log("error in getting user's endorsmentd "+err);
            var status={
                code:0,
                msg:"No user found",
              
            }
            return res.status(500).json(status);
        })
})

/*********************************************************************************
 * url to get user endorsments  info by user id
 * input: userId 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getUserEndorsmentsDetailsById?key=-LFN623dPlQ2FRPc2KaC
 * @Author Mansi 21.06.2018
 */
exports.getUserEndorsmentsDetailsById = functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var endorseUserId=req.body.endorsUserId;
    console.log("endorseUserId "+endorseUserId);
    console.log("userId "+userId);
    var endorsments=[];
    var userEndorsmentsref = admin.database().ref('userknowsabout')
        .orderByChild('userId').equalTo(userId);
        userEndorsmentsref.once('value').then(function(skillsSnap) {
            console.log("skillsSnap "+JSON.stringify(skillsSnap));
            if(skillsSnap.exists()){
                var count=0;
                var myFunctToRunAfter = function () {
                    var status={
                        code:1,
                        msg:"Endorsments for user",
                        data:endorsments
                      
                    }
                    return res.status(200).json(status);
                }              
                return new Promise(function(resolve, reject) {
                    skillsSnap.forEach(skills=>{
                        count++;
                        console.log("skils "+JSON.stringify(skills)+ " "+ skillsSnap.numChildren());
                        var userEndorsedsref = admin.database().ref('userEndorsedTo')
                        .orderByChild('EndorsFromUserId').equalTo(endorseUserId);
                        userEndorsedsref.once('value').then(function(EndorsedSnap) {
                           
                            if(EndorsedSnap.exists()){
                              
                                EndorsedSnap.forEach(endorsment=>{
                                    if(endorsment.val().endorsmentID === skills.key){
                                        var data={
                                            endorsmentId:skills.key,
                                            endorsmentData:skills.val(),
                                            isEndorsed:true
                                        }
                                        endorsments.push(data);
                                        endorsments.sort(function(a, b) {
                                            return parseFloat(b.endorsmentData.endorsementCount) - parseFloat(a.endorsmentData.endorsementCount);
                                        });
                                    }
                                    else{
                                        var data1={
                                            endorsmentId:skills.key,
                                            endorsmentData:skills.val(),
                                            isEndorsed:false
                                        }
                                        endorsments.push(data1);
                                        endorsments.sort(function(a, b) {
                                            return parseFloat(b.endorsmentData.endorsementCount) - parseFloat(a.endorsmentData.endorsementCount);
                                        });
                                    }
                                })
                            }
                            else{
                                var data={
                                    endorsmentId:skills.key,
                                    endorsmentData:skills.val(),
                                    isEndorsed:false
                                }
                                endorsments.push(data);
                                endorsments.sort(function(a, b) {
                                    return parseFloat(b.endorsmentData.endorsementCount) - parseFloat(a.endorsmentData.endorsementCount);
                                });
                            }
                            console.log("count "+count);
                            console.log("endorsments.length "+endorsments.length);
                            if(skillsSnap.numChildren() === endorsments.length){
                               
                                resolve(myFunctToRunAfter())
                               
                            }
                            return 0
                        }).catch(err=>{
                            console.log("error in get user enordment details "+err);
                        })
                      
                    })
                })
               
            }
            else{
                var status1={
                    code:0,
                    msg:"No Endorsments found for user",
                  
                }
                return res.status(500).json(status1);
            }
         
        }).catch(err=>{
            console.log("error in getting user's endorsmentd "+err);
            var status={
                code:0,
                msg:"No user found",
              
            }
            return res.status(500).json(status);
        })
})

/*****************************************************************************************************
 * url to unendorse the skill 
 * input : userId , endorsment id
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/unEndorseUser
 * data:{
    "userId":"-LCs9UnX5qiVhChsoudZ",
    "endorsementId":"1"
}
 */
exports.unEndorseUser=functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var endorsementId=req.body.endorsementId;
    var userEndorsedsref = admin.database().ref('userEndorsedTo')
    .orderByChild('EndorsFromUserId').equalTo(userId);
    userEndorsedsref.once('value').then(EndorsedSnap=> {
        console.log("EndorsedSnap "+JSON.stringify(EndorsedSnap));
        EndorsedSnap.forEach(skill=>{
            if(skill.val().endorsmentID === endorsementId){
                console.log("skills "+JSON.stringify(skill.key));
                var skillRef=admin.database().ref('userEndorsedTo').child(skill.key);
                skillRef.remove().then(function(snap){
                   var status={
                       code:1,
                       msg:"User endorsment Removed scusseefully"
                   }
                   updateEndorsment(endorsementId,0,userId);
                   return res.status(200).json(status);
               }).catch(error=>{
                   var status={
                       code:0,
                       msg:"Error in deleting endorsment details"
                   }
                   return res.status(400).json(status);
               });
            }
        })
        return 0
    }).catch(err=>{
        console.log("error in getting user endorsment details "+err);
    })
})

/******************************************************************************************************
 * url to subscribe the user 
 * input : subscribing user id ,subcriber user id 
 * @Author Mansi 25.06.2018
 * url : https://us-central1-logos-app-915d7.cloudfunctions.net/addUserSubscription
 * data :{
	"userId":"-LCs9UnX5qiVhChsoudZ",
"subscribeTo":"-LFN623dPlQ2FRPc2KaC"
}
 */
exports.addUserSubscription=functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var subscribeTo=req.body.subscribeTo;
    var data={
        userId:userId,
        subscribeTo:subscribeTo
    }
    var myRef = admin.database().ref('/userSubscription').push(data).then((snapshot) => {
        
        console.log("done "+snapshot.key);
        var status={
            code:1,
            msg:"User Subscription Added scusseefully",
        }
       
        // to send notification  
        var userRef = admin.database().ref('/user').child(subscribeTo);
            userRef.once('value').then((userSnap)=> {
                console.log("in userSnap ");
                var userDetails=userSnap.val()
                    //userDetails.APNToken
                    sendNoti(subscribeTo,userDetails.APNToken,"New Subscription",1,userId);
                    return 0
            }).catch(err=>{
            console.log("userRef err "+err);
            })


        return res.status(200).json(status);
    }).catch(err=>{
        console.log("error is "+err)
        var status={
            code:0,
            msg:"Error while addinf User Subscription",
        }
        return res.status(400).json(status);
    })
})   
/******************************************************************************************************
 * url to remove subscribe i.e unscbscrib the user 
 * input : subscribing user id ,subcriber user id 
 * @Author Mansi 25.06.2018
 * url : https://us-central1-logos-app-915d7.cloudfunctions.net/removeUserSubscription
 * data :{
	"userId":"-LCs9UnX5qiVhChsoudZ",
"subscribeTo":"-LFN623dPlQ2FRPc2KaC"
}
 */
exports.removeUserSubscription=functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var subscribeTo=req.body.subscribeTo;
  
    var myRef = admin.database().ref('/userSubscription').orderByChild("subscribeTo").equalTo(subscribeTo)
    myRef.once('value').then(function(subscribeRefSnap) {
        console.log("subscribeRefSnap "+JSON.stringify(subscribeRefSnap));
        subscribeRefSnap.forEach(subscribe=>{
            if(userId === subscribe.val().userId ) {
                var subscribeRef=admin.database().ref('userSubscription').child(subscribe.key);
                subscribeRef.remove().then(function(snap){
                   var status={
                       code:1,
                       msg:"User Subscription Removed scusseefully"
                   }

                     // to send notification  
                    var userRef = admin.database().ref('/user').child(subscribeTo);
                    userRef.once('value').then((userSnap)=> {
                        console.log("in userSnap ");
                        var userDetails=userSnap.val()
                            //userDetails.APNToken
                            sendNoti(subscribeTo,userDetails.APNToken,"Unsubscription",5,userId);
                            return 0
                    }).catch(err=>{
                    console.log("userRef err "+err);
                    })
                   return res.status(200).json(status);
               }).catch(error=>{
                console.log("error is "+error)
                   var status={
                       code:0,
                       msg:"Error in removing user seubscription"
                   }
                   return res.status(400).json(status);
               });
          
            }
        })
        return 0;
    }).catch(err=>{
        console.log("error is "+err)
        var status={
            code:0,
            msg:"Error while addinf User Subscription",
        }
        return res.status(400).json(status);
    })
})   
/*** url to check user subscribed or not 
 * input: logged in user id, user id to view profile details
 * 
 */
exports.getUserByIdAndSubscriptionDetails = functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var userToBeSubscribe=req.body.userToBeSubscribe;
    console.log(" userId "+userId);
    console.log(" userToBeSubscribe "+userToBeSubscribe);
    var userref = admin.database().ref('user')
    .child(userId)
    userref.once('value').then(function(snap) {
        console.log("user snap "+JSON.stringify(snap));
        var lives="From "+snap.val().city+", "+snap.val().country;
        var cred=[]
        
        var userpointoref = admin.database().ref('userpoints')
        .orderByChild('userId').equalTo(userId);
        userpointoref.once('value').then(function(pointSnap) {
            console.log("point s "+JSON.stringify(pointSnap));
            var userpoint=0;
            pointSnap.forEach(point=>{
                var points=point.val().points;
                userpoint=userpoint+points
            })
            console.log("user final points "+userpoint);
            var userknowsAboutref = admin.database().ref('usercreadentials')
            .orderByChild('userId').equalTo(userId);
            userknowsAboutref.once('value').then(function(credSnap) {
                if(credSnap.exists()){
                    //type 0:educational 1:Experience 2:City and Country 3:languages
                    credSnap.forEach(usercr=>{
                        var data={
                            type:usercr.val().type,
                            name:usercr.val().creadentials
                        }
                        cred.push(data);
                    })
                } 
                var userlangref = admin.database().ref('userLanguages')
                .orderByChild('userId').equalTo(userId);
                userlangref.once('value').then(function(langSnap) {
                    finallang="";
                    var lang="NA"
                   if(langSnap.exists()){
                    langSnap.forEach(lang=>{
                        finallang=finallang+","+lang.val().
                        name;
                    })
                   }
                   else{
                    lang="NA"
                   }
                    finallang=finallang.substring(1);
                    var data={
                        type:3,
                        name:lang
                    }
                    cred.push(data);
                    var livesData={
                        type:2,
                        name:lives
                    }
                    cred.push(livesData);
                    var isSubscribe=false;
                    var userSubscriberref = admin.database().ref('userSubscription')
                    .orderByChild('userId').equalTo(userId);
                    userSubscriberref.once('value').then(function(subSnap) {
                        console.log("subSnap "+JSON.stringify(subSnap));
                        var subpoints=0;
                        var count=0;
                        if(subSnap.exists()){
                            var myFunctToRunAfter = function () {
                                var userData={
                                    userId:userId,
                                    userName:snap.val().name,
                                    userpoints:userpoint,
                                    userCredDetails:cred,
                                    userEndorsment:snap.val().highEndorsmentName,
                                    userProfile:snap.val().photo,
                                    userSubscribers:subpoints,
                                    isSubscribe:isSubscribe
                                }
                                var status={
                                    code:1,
                                    msg:"User Data",
                                    data:userData
                                }
                                return res.status(200).json(status);
                            }
                            return new Promise(function(resolve, reject) {
                                subSnap.forEach(sub=>{
                                    count++;
                                    subpoints=subpoints+1;
                                    console.log("sub "+JSON.stringify(sub));
                                    if(userId === sub.val().userId){
                                        console.log("in if ");
                                        isSubscribe=true
                                    }
    
                                })
                                if(count === subSnap.numChildren() ){
                                     resolve(myFunctToRunAfter())
                                }
                            })
                            
                            
                        }
                        else{
                            subpoints=0;
                            var userData1={
                                userId:userId,
                                userName:snap.val().name,
                                userpoints:userpoint,
                                userCredDetails:cred,
                                userEndorsment:snap.val().highEndorsmentName,
                                userProfile:snap.val().photo,
                                userSubscribers:subpoints,
                                isSubscribe:isSubscribe
                            }
                            var status1={
                                code:1,
                                msg:"User Data",
                                data:userData1
                            }
                            return res.status(200).json(status1);
                        }
                       
                       
                    }).catch(err=>{
                        console.log("Error in getting user subscriber "+err);
                    })
                    return 0;
                }).catch(err=>{
                    console.log("Error in getting user's language details"+err );
                })
                return 0;
            }).catch(err=>{
                console.log("error in getting users credentials details "+err);
            })
            return 0;
        }).catch(err=>{
            console.log("error in getting user's point "+err);
        })
        return 0;
    }).catch(err=>{
        console.log("error in getting usrr info "+err)
        var status={
            code:0,
            msg:"No user found",
          
        }
        return res.status(500).json(status);
    })
})
/*********************************************************************************
 * url to get user Language  info by user id
 * input: userId 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/getUserLanguagesById?key=-LFN623dPlQ2FRPc2KaC
 * @Author Mansi 26.06.2018
 */
exports.getUserLanguagesById = functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var endorsments=[];
    var userEndorsmentsref = admin.database().ref('userLanguages')
        .orderByChild('userId').equalTo(userId);
        userEndorsmentsref.once('value').then(function(skillsSnap) {
            console.log("skillsSnap "+JSON.stringify(skillsSnap));
            if(skillsSnap.exists()){
                skillsSnap.forEach(skills=>{
                    var data={
                        languageId:skills.key,
                        languageData:skills.val()
                    }
                    endorsments.push(data);
                    
                })
                var status={
                    code:1,
                    msg:"Languages for user",
                    data:endorsments
                  
                }
                return res.status(200).json(status);
            }
            else{
                var status1={
                    code:0,
                    msg:"No Languages found for user",
                  
                }
                return res.status(500).json(status1);
            }
          
        }).catch(err=>{
            console.log("error in getting user's Languages "+err);
            var status={
                code:0,
                msg:"No user found",
              
            }
            return res.status(500).json(status);
        })
})
/*****************************************************************************************************
 * url to update the user details 
 * input : userId ,json object to be edit
 * @Author Mansi 26.06.2018
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/updateUser
 */
exports.updateUser = functions.https.onRequest((req,res)=>{
    var userId=req.body.userId;
    var data=req.body.data;
    var userRef=admin.database().ref('user').child(userId);
    userRef.update(data).then(userSnap=>{
        console.log("userSnap "+JSON.stringify(userSnap));
        var status={
            code:1,
            msg:"User Updated Successfully",
          
        }
        return res.status(200).json(status);
    }).catch(err=>{
        console.log("error in updating "+err);
        var status={
            code:0,
            msg:"Error in updating user ",
          
        }
        return res.status(500).json(status);
    })
})
/*********************************************************************************************
 * url to update language 
 * @Author Mansi 27.06.2018
 * input: language id, edited data 
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/updateLanguage
 * data:{
	"id":"0",
	"data":{
		"name":"Hindi"
	}
}

 */
exports.updateLanguage = functions.https.onRequest((req,res)=>{
    var id=req.body.id;
    var data=req.body.data;
    var userlangRef=admin.database().ref('userLanguages').child(id);
    userlangRef.update(data).then(userSnap=>{
        console.log("userSnap "+JSON.stringify(userSnap));
        var status={
            code:1,
            msg:"User language Update Successfully",
          
        }
        return res.status(200).json(status);
    }).catch(err=>{
        console.log("error in updating langugae"+err);
        var status={
            code:0,
            msg:"Error in updating user language ",
          
        }
        return res.status(500).json(status);
    })
})
/**********************************************************************************************************
 * url to add user languages 
 * @Author Mansi 27.06.2018
 * input: userId,laguge name
 * url : https://us-central1-logos-app-915d7.cloudfunctions.net/addUserLanguages
 * data:{
	"name":"Hindi",
	"userId":"-LCs9UnX5qiVhChsoudZ"
	}
 */


exports.addUserLanguages=functions.https.onRequest((req,res)=>{
    var UserLanguagestData={
        "name":req.body.name,      
        "userId":req.body.userId
       
    }
    var UserLanguagesRef = admin.database().ref('/userLanguages')
    .push(UserLanguagestData).then((snapshot) => {
        console.log("snapshot "+snapshot)
        var status={
            code:1,
            msg:"user Language added"
        }
        return res.status(200).json(status);
    }).catch(err=>{
        console.log("error in adding user languages "+err);
        var status={
            code:0,
            msg:"error while  adding user languages "
        }
        return res.status(400).json(status);
    })
})

/*****************************************************************************************************
 * url to get list of languages 
 * @Author Mansi 28.06.2018
 * input userId
 * url =https://us-central1-logos-app-915d7.cloudfunctions.net/getAllLanguages?key=-LFN623dPlQ2FRPc2KaC
 */
exports.getAllLanguages=functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var lang=[]
    console.log("userId "+userId);
    var langRef = admin.database().ref('languages')
    .orderByKey().once('value').then(function(snap) {
        console.log("lang "+JSON.stringify(snap));
        var userEndorsmentsref = admin.database().ref('userLanguages')
        .orderByChild('userId').equalTo(userId).once('value').then(function(langsnap) {
            console.log("langsnap "+JSON.stringify(langsnap));
            var count=0;
            var myFunction = function () {
                var status={
                    code:1,
                    msg:"lang details",
                    data:lang
                }
                return res.status(200).json(status);
              }
            return new Promise(function(resolve, reject) {
                var isPush=true;
                snap.forEach(langs=>{
                    count++;
                   
                    langsnap.forEach(userlang=>{
                       // console.log("langs.val().name "+langs.val().name);
                        //console.log("userlang.val().name "+userlang.val().name);
                        if(langs.val().name === userlang.val().name){
                           isPush=true
                           return
                        }
                       
                    })
                    if(!isPush){
                        lang.push(langs);
                    }
                    else{
                        isPush=false
                    }
                })

                var datalenghth=snap.numChildren()-langsnap.numChildren();
                console.log("count "+count);
                console.log("snap.numChildren() "+snap.numChildren());
                console.log("langsnap.numChildren() "+langsnap.numChildren());
                if (count === snap.numChildren()){
                    resolve(myFunction())
                }
            })
          //  return 0;
        }).catch(err=>{
            console.log("err in getting user languages"+err)
        })
        return 0;
        }).catch(err=>{
        console.log("err in getting list of langauges "+err);
    })
})

/**************************************************************************************************
 * url to add langauges in databas 
 * input laguage name 
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/languages
 * data:{
  "name":"Croatian"
}
 * 
 * @Author Mansi  29.06.2018
 */
exports.languages=functions.https.onRequest((req,res)=>{
    var data={
        name:req.body.name
    }
    var myRef = admin.database().ref('languages').push(data)
       .then((snapshot) => {
           console.log("user points added  ");
           status={
            code:1,
            msg:"languages  added"
        }
        return res.status(200).json(status);
         
       }).catch(err=>{
           console.log("Error in adding languages "+err);
           status={
            code:0,
            msg:"Error in adding languages "
        }
        return res.status(500).json(status);
       });

})

/**************************************************************************************************
 * url to add user credentails details 
 * input :userid, name ,type 
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/addCredentials
 * data:{
        "userId":"-LFN623dPlQ2FRPc2KaC",
        "type":0,
        "name":"Test"
    } 
 * @Author Mansi  29.06.2018
 */
exports.addCredentials=functions.https.onRequest((req,res)=>{
    var data={
        userId:req.body.userId,
        type:req.body.type,
        creadentials:req.body.name
    }
    var myRef = admin.database().ref('usercreadentials').push(data)
       .then((snapshot) => {
           console.log("user creadentials added  ");
           status={
            code:1,
            msg:"User  creadentials"
        }
        return res.status(200).json(status);
         
       }).catch(err=>{
           console.log("Error in adding creadentials "+err);
           status={
            code:0,
            msg:"Error in adding creadentials "
        }
        return res.status(500).json(status);
       });
})

/**************************************************************************************************
 * url to update user credentails details 
 * input :userid, name ,type 
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/updateCredentials
 * data:{
	"credNo":0,
	"name":"BE Computer"
}
 * @Author Mansi  29.06.2018
 */
exports.updateCredentials=functions.https.onRequest((req,res)=>{
   
    var key=req.body.credNo;
    var pointRef=admin.database().ref('usercreadentials');
    var child = pointRef.child(key);
    child.once('value', function(snapshot) {
      // pointRef.child().set(snapshot.val());
            child.update({"creadentials":req.body.name}).then(function(snap){
                var status={
                    code:1,
                    msg:"User  creadentials Updated scusseefully"
                }
                return res.status(200).json(status);
            }).catch(error=>{
                var status={
                    code:0,
                    msg:"Error in Updating User  creadentials"
                }
                return res.status(400).json(status);
            });
    });
})
/**************************************************************************************************
 * url to update user knows about  details 
 * input :userid, name 
 * @Author Mansi 02.07.2018
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/knowsAbout
 * 
 */
exports.updateKnowsAbout=functions.https.onRequest((req,res)=>{
   
    var key=req.body.credNo;
    var pointRef=admin.database().ref('userknowsabout');
    var child = pointRef.child(key);
    child.once('value', function(snapshot) {
      // pointRef.child().set(snapshot.val());
            child.update({"knowledge":req.body.name}).then(function(snap){
                
                var status={
                    code:1,
                    msg:"User Knows about Updated scusseefully"
                }
                return res.status(200).json(status);
            }).catch(error=>{
                var status={
                    code:0,
                    msg:"Error in Updating User knows about"
                }
                return res.status(400).json(status);
            });
    });
})
/**************************************************************************************************
 * url to add user pre deifine Knows about  in databas 
 * input user knows about name 
 * url: https://us-central1-logos-app-915d7.cloudfunctions.net/languages
 * data:{
  "name":"Croatian"
}
 * 
 * @Author Mansi  14.07.2018
 */
exports.knowsAbout=functions.https.onRequest((req,res)=>{
    var data={
        name:req.body.name
    }
    var myRef = admin.database().ref('knowsAbout').push(data)
       .then((snapshot) => {
           status={
            code:1,
            msg:"Knows about  added"
        }
        return res.status(200).json(status);
         
       }).catch(err=>{
           console.log("Error in adding Knows about "+err);
           status={
            code:0,
            msg:"Error in adding Knows about "
        }
        return res.status(500).json(status);
       });

})

/*****************************************************************************************************
 * url to get list of user knows about it according to user id  
 * @Author Mansi 14.07.2018
 * input userId
 * url =https://us-central1-logos-app-915d7.cloudfunctions.net/getAllLanguages?key=-LFN623dPlQ2FRPc2KaC
 */
exports.getuserKnowsList=functions.https.onRequest((req,res)=>{
    var userId=req.query.key;
    var lang=[]
    console.log("userId "+userId);
    var langRef = admin.database().ref('knowsAbout')
    .orderByKey().once('value').then(function(snap) {
        console.log("lang "+JSON.stringify(snap));
        var userEndorsmentsref = admin.database().ref('userknowsabout')
        .orderByChild('userId').equalTo(userId).once('value').then(function(langsnap) {
            console.log("langsnap "+JSON.stringify(langsnap));
            var count=0;
            var myFunction = function () {
                var status={
                    code:1,
                    msg:"Knows about  details",
                    data:lang
                }
                return res.status(200).json(status);
              }
            return new Promise(function(resolve, reject) {
                var isPush=true;
                snap.forEach(langs=>{
                    count++;
                   
                    langsnap.forEach(userlang=>{
                       // console.log("langs.val().name "+langs.val().name);
                        //console.log("userlang.val().name "+userlang.val().name);
                        if(langs.val().name === userlang.val().knowledge){
                           isPush=true
                           return
                        }
                       
                    })
                    if(!isPush){
                        lang.push(langs);
                    }
                    else{
                        isPush=false
                    }
                })

                var datalenghth=snap.numChildren()-langsnap.numChildren();
                console.log("count "+count);
                console.log("snap.numChildren() "+snap.numChildren());
                console.log("langsnap.numChildren() "+langsnap.numChildren());
                if (count === snap.numChildren()){
                    resolve(myFunction())
                }
            })
          //  return 0;
        }).catch(err=>{
            console.log("err in getting user knows about"+err)
        })
        return 0;
        }).catch(err=>{
        console.log("err in getting list of knows about  "+err);
    })
})

/**********************************************************************************************
 * update view of news
 * input: user id, newsid
 * @Author Mansi 26.07.2018
 */
exports.UpdateNewsViews = functions.https.onRequest((req,res)=>{
    console.log("req.body.userId "+req.body.userId)
    var newsId=req.body.newsId;
    var newsViewsCountRef = admin.database().ref('newsViews')
    .orderByChild('userId').equalTo(req.body.userId);
    newsViewsCountRef.once('value').then(newsSnap=> {
        if(newsSnap.exists()){
            var ispush=false;
            newsSnap.forEach(news=>{
                console.log("news.val().newsId "+news.val().newsId);
                if(newsId === news.val().newsId){
                    console.log("Dont push  ");
                    ispush=false;
                     updateNews(newsId);
                     var status={
                        code:1,
                        msg:"View Added Successfully"
                    }
                
                    return res.status(200).json(status);
                }
                else{
                    console.log("Push in db  ");
                    ispush=true;
                }
            })
            if(ispush){
                var data={
                    "newsId":req.body.newsId,
                    "userId":req.body.userId
                }
                admin.database().ref('newsViews').push(data)
                    .then(newsViewSnap=>{
                        console.log("replySnap "+JSON.stringify(newsViewSnap));
                        updateNews(newsId);
                        var status={
                            code:1,
                            msg:"View Added Successfully"
                        }
                    
                        return res.status(200).json(status);
                    }).catch(err=>{
                        console.log("err in adding view "+err);
                    })
                
            }
        }
        else{
            var data1={
                "newsId":req.body.newsId,
                "userId":req.body.userId
            }
            admin.database().ref('newsViews').push(data1)
                .then(newsViewSnap=>{
                    console.log("replySnap "+JSON.stringify(newsViewSnap));
                    updateNews(newsId);
                    var status={
                        code:1,
                        msg:"View Added Successfully"
                    }
                
                    return res.status(200).json(status);
                }).catch(err=>{
                    console.log("err in adding view "+err);
                })
        }
        return 0;
    }).catch(err=>{
        console.log("error in Updating news view "+err);
        var status={
            code:0,
            msg:"Error in  Updating news view "
        }
        return res.status(400).json(status);
    })
})
function updateNews(newsId){
    var newsViewsCountRef = admin.database().ref('newsViews')
    .orderByChild('newsId').equalTo(newsId);
    newsViewsCountRef.once('value').then(newsSnap=> {
        console.log("newsSnap "+JSON.stringify(newsSnap))
        if(newsSnap.exists()){
            console.log("newsSnap "+newsSnap.numChildren());
            var url="/posts/"+newsId;
            var postRef=admin.database().ref("posts").child(newsId)
            console.log("url "+postRef);
            postRef.update({"views": newsSnap.numChildren()}).then(postSnap=>{
                    console.log("postSnap "+postSnap);
                    return 0;
                }).catch(err=>{
                console.log("error in Updating news view in post table"+err);
                var status={
                    code:0,
                    msg:"Error in  Updating news view in post table"
                }
               
            })
        }
       
        return 0;
    }).catch(err=>{
        console.log("error in Updating news view "+err);
        var status={
            code:0,
            msg:"Error in  Updating news view "
        }
      
    })
}  
function addUserPointAfterCommentsOrReply(userId,type){
    console.log("in addUserPointAfterCommentsOrReply"+userId +" type "+type);
    var data={
        "userId":userId,
        "type":type
    }
   
    var pointRef=admin.database().ref('/points')
     .orderByChild('title').equalTo(type);
     pointRef.once('value').then(function(pointSnapshot) {
         
         pointSnapshot.forEach(function (childSnapshot) {

         var value = childSnapshot.val();
         points=value.points;
         console.log("Title is : " + value.points);
     });
       var userPointsData={
           "points":points,
           "userId":userId,
           "note":"User Points Added benifit of "+type
       }
       var myRef = admin.database().ref('/userpoints').push(userPointsData)
       .then((userpointSnapshot) => {
           console.log("user points added  ");
           status={
            code:1,
            msg:"user points added"
        }
      //  return res.status(200).json(status);
         return 0;
       }).catch(err=>{
           console.log("Error in adding user points "+err);
       });
     
       return 0
     }).catch(error=>{
     console.log("error in getting points from point table "+error)
        status={
            code:0,
            msg:"Error in user Points addition"
        }
      //  return res.status(400).json(status);
     });
}
/**
 * url to add feed back and add report as inappropriate activity
 * input:user id, type ,description 
 * @Author Mansi 31.07.2018
 * type:
 * 1:Feedback
 * 2.Report as inapporopriate
 * url :https://us-central1-logos-app-915d7.cloudfunctions.net/addFeedback
 * data:
 * {
	"type":1,
	"userId":"-LIhKyZrwZlmlemAcHq0",
	"desc":"Testing feedback"
}
 */
exports.addFeedback = functions.https.onRequest((req,res)=>{
    var data={
        "type":req.body.type,
        "userId":req.body.userId,
        "description":req.body.desc
    }
    var pointRef = admin.database().ref('feedback');
      return admin.database().ref('feedback').push(data).then((snapshot) => {
         console.log("sucess")
         var msg=""
         if(parseInt(req.body.type) === 1){
            msg="Feedback Added Successfully"
         }
         else{
            msg="Reported as Inappropriate Successfully"
         }
         var status={
             code:1,
             msg:msg
         }
         return res.status(200).json(status);
       }).catch(err=>{
         console.log("eror"+err)
         var status={
            code:0,
            msg:"Error while adding feedback"
        }
         return res.status(400).json(status);
       });
})
/** update comment data 
 * @Author Mansi 31.07.2018
 * input: comment id,comment
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/updateComment
 * data:
 * {
	"commentId":"-LIindXnazv9G-DjdEjv",
	"comments":"Edit Comment",
	"openion":1
}
*/
exports.updateComment = functions.https.onRequest((req,res)=>{
    var commentRef = admin.database().ref('postcomments')
    .child(req.body.commentId)
    commentRef.once('value').then(commentSnap=> {
    if(commentSnap.exists()){
        console.log("commentSnap "+JSON.stringify(commentSnap));
        var previouscomment=commentSnap.val()
        var data={
            "isEdited": 1,
            "comments":req.body.comments,
            "openion":parseInt(req.body.opinion)
        }
        commentRef.update(data).then(updateCommentSnap=>{
            console.log("updateCommentSnap "+JSON.stringify(updateCommentSnap))
            console.log("commentsnap "+JSON.stringify(previouscomment))
            var editCommentData={
                "commentId":req.body.commentId,
                "comments":previouscomment.comments,
                "deletedByAdmin":previouscomment.deletedByAdmin,
                "deletedReason":previouscomment.deletedReason,
                "isDeleted":previouscomment.isDeleted,
                "isReported":previouscomment.isReported,
                "openion":previouscomment.openion,
                "postId":previouscomment.postId,
                "userId":previouscomment.userId
            }
            var editCommentre=admin.database().ref('commenteditedhistory')
            return admin.database().ref('commenteditedhistory').push(editCommentData).then((snapshot) => {
                var status={
                    code:1,
                    msg:"Comment Updated Successfully"
                }
                return res.status(400).json(status);
            }).catch(err=>{
                console.log("error while updating comment in commenteditedhistory"+err)
                var status={
                    code:0,
                    msg:" Comment updating error in commenteditedhistory"
                }
                return res.status(400).json(status);
            })
           
        }).catch(err=>{
            console.log("error while updating comment "+err)
            var status={
                code:0,
                msg:" Comment updating error"
            }
            return res.status(400).json(status);
        })
        return 0
    }
    else{
        var status={
            code:0,
            msg:" Comment not found"
        }
        return res.status(400).json(status);
    }
    }).catch(err=>{
        console.log("err "+err)
        var status={
            code:0,
            msg:"Error in fetching comment by id"
        }
        return res.status(400).json(status);
    })
})
/***********************************************************************
 * url to update reply 
 * @Author Mansi 01.08.2018
 * input:reply id ,reply,opinion 
 * url:https://us-central1-logos-app-915d7.cloudfunctions.net/updateReply
 * data:
 */
exports.updateReply = functions.https.onRequest((req,res)=>{
    var commentRef = admin.database().ref('commentsonpostcomments')
    .child(req.body.replyId)
    commentRef.once('value').then(replySnap=> {
        if(replySnap.exists()){
            var previousReply=replySnap.val()
            var data={
                "isEdited": 1,
                "comments":req.body.reply
            }
            commentRef.update(data).then(updateReplySnap=>{
                console.log("updateCommentSnap "+JSON.stringify(updateReplySnap))
                console.log("commentsnap "+JSON.stringify(previousReply))
                var editReplyData={
                    "replyId":req.body.replyId,
                    "commentId":previousReply.commentId,
                    "comments":previousReply.comments,
                    "deletedByAdmin":previousReply.deletedByAdmin,
                    "isDeleted":previousReply.isDeleted,
                    "openion":previousReply.openion,
                    "reason":previousReply.reason,
                    "userId":previousReply.userId 
                }
                var editCommentre=admin.database().ref('replyEditedhistory')
                return admin.database().ref('replyEditedhistory').push(editReplyData).then((snapshot) => {
                    var status={
                        code:1,
                        msg:"Reply Updated Successfully"
                    }
                    return res.status(400).json(status);
                }).catch(err=>{
                    console.log("error while updating reply in replyEditedhistory"+err)
                    var status={
                        code:0,
                        msg:" reply updating error in replyEditedhistory"
                    }
                    return res.status(400).json(status);
                })
            }).catch(err=>{
                console.log("error while updating comment "+err)
                var status={
                    code:0,
                    msg:" Reply updating error"
                }
                return res.status(400).json(status);
            })
        }
        else{
            var status={
                code:0,
                msg:" Reply not found"
            }
            return res.status(400).json(status);
        }
        return 0;
    }).catch(err=>{
        console.log("err "+err)
        var status={
            code:0,
            msg:"Error in fetching Reply by id"
        }
        return res.status(400).json(status);
    })
})

/*******************************Notification URL */
//https://us-central1-logos-app-915d7.cloudfunctions.net/sendNotification
exports.sendNotification = functions.https.onRequest((req,res)=>{
    var token = req.body.token; 
    var status={
        code:1,
        msg:"Message sent"
    }
   

    var registrationToken = token
    
    let tokens = [];
	tokens.push(registrationToken);
      let payload = {
        notification: {
            title: 'Firebase Notification',
            body: "Message by subodh",
            sound: 'default',
            badge: '1'
        }
    };

    admin.messaging().sendToDevice(tokens,payload)
        .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
        return res.status(200).json(status);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
        return res.status(400).json(status);
    });
    
})

/* Function to update firebase APN token using user Id  @Author subodh3344 
URL :https://us-central1-logos-app-915d7.cloudfunctions.net/setFirebaseToken
*/
exports.setFirebaseToken = functions.https.onRequest((req,res)=>{
    var userId = req.body.userId;
   var token = req.body.token;
   var status={
       code:1,
       msg:"Message sent"
   }
  

   var userRef=admin.database().ref('user');
   var child = userRef.child(userId);
   child.once('value', function(snapshot) {
     // pointRef.child().set(snapshot.val());
           child.update({"APNToken":req.body.token}).then(function(snap){
               
               var status={
                   code:1,
                   msg:"User APNToken updated .."
               }
               return res.status(200).json(status);
           }).catch(error=>{
               var status={
                   code:0,
                   msg:"Error in Updating APNToken"
               }
               return res.status(400).json(status);
           });
   });

   
})

/* Send notification on  */
function sendNoti(toUserId,APNKey,title,type,fromUserId){
    console.log("got APN "+APNKey+" and fromUserId "+fromUserId);
    //get user details to show msg like priya has subscribe you
    var userRef = admin.database().ref('user').child(fromUserId);
    userRef.once('value').then((userSnap)=> {
        console.log("in userSnap ");
        var userDetails=userSnap.val()
             // subscription notification
           
            
            let msgTitle = "";
            let msgBody = "";
            // if user subscribes 
            if(type === 1){
                msgTitle = "Subscription";
                msgBody = userDetails.name+" subscribed to you.";
            }
            // if user comments on news
            else if(type === 2){
                msgTitle  = "Comments";
                msgBody = userDetails.name+" commented on your news.";
            }
            // if user replies on comment
            // if user endorse other user
            else if(type === 3){
                msgTitle  = "Endorsed";
                msgBody = userDetails.name+ "endorsed on your skill.";
            }
            // if user unendorse other user
            else if(type === 4){
                msgTitle  = "Unendorsed";
                msgBody = userDetails.name+" unendorsed your skill.";
            }
            // if user unsubscribe to user
            else if(type === 5){
                msgTitle  = "Unsubscribe";
                msgBody = userDetails.name+" unscbscribed you.";
            }
            else if(type === 6){
                msgTitle  = "Reply";
                msgBody = userDetails.name+" replied on your comment.";
            }
            
            var registrationToken = APNKey
            
            let tokens = [];
            tokens.push(registrationToken);
            let payload = {
                notification: {
                    title: msgTitle,
                    body:  msgBody,
                    sound: 'default',
                    badge: '1'
                }
            };

            admin.messaging().sendToDevice(tokens,payload)
                .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:'+JSON.stringify(response));
                var notiData = {
                            toUser : toUserId,
                            title : msgTitle,
                            body : msgBody,
                            messageId : response.multicastId,
                            createdOn: moment().format(),
                            fromUser:fromUserId
                        };
                        var myRef = admin.database().ref('/userNotification').push(notiData)
                        .then((notiAddSnap) => {
                            console.log("noti added "+notiAddSnap.key);
                            return 0;
                        }).catch(err=>{
                            console.log("error add user notification "+err);
                            return 0;
                        });
                        return 0;

            })
            .catch((error) => {
                console.log('Error sending message:'+ error);
            var status={
                        code:0,
                        msg:"Error in  adding notifications details"
                    }
                return 0;
            });
          return 0;
    }).catch(err=>{
    console.log("userRef err "+err);
    })    
}

/*******************************fetch Notification URL by user ID*/
//https://us-central1-logos-app-915d7.cloudfunctions.net/getNotifications
// data = {	"userId":"-LIjqeXa4rhjySYcfzom"}
exports.getNotifications = functions.https.onRequest((req,res)=>{
    var userId = req.body.userId;
    var finalNotiArray = [];
    console.log("fetch notifications for "+userId);
    var getNoti = admin.database().ref('/userNotification').orderByChild("toUser").equalTo(userId);
    getNoti.once('value',(gotNotifications)=>{
        if(gotNotifications.exists()){
            var finalFunction = function(){
                var status = {
                    code :1,
                    msg : "Got Notifications",
                    data : finalNotiArray
                }
                return res.status(200).json(status);
            }
            var isProccessing = false;
            return new Promise((resolve,reject)=>{
                var counter = 0;
                gotNotifications.forEach((noti)=>{
                    console.log("JSOn stri "+JSON.stringify(noti));
                    console.log("cccc "+noti.val().fromUser);
                    var userRef = admin.database().ref('user').child(noti.val().fromUser);
                    userRef.once('value').then((userSnap)=> {
                        console.log("usernsanap "+JSON.stringify(userSnap.val()));
                    
                        isProccessing = true;
                        counter++;
                        var timeago=moment(noti.val().createdOn).fromNow()
                        var not  = {
                            notiTitle : noti.val().title,
                            notiBody : noti.val().body,
                            notiMessageid : noti.val().messageId,
                            toUser : noti.val().toUser,
                            fromUserId:noti.val().fromUser,
                            userName :userSnap.val().name,
                            userPhoto: userSnap.val().photo,
                            userHighrEndorsment:userSnap.val().highEndorsmentName,
                            timeago:timeago
                            
                        }
                        console.log("not is "+JSON.stringify(not));
                        finalNotiArray.push(not);
                        isProccessing = false;
                        console.log(gotNotifications.numChildren() +"==="+ finalNotiArray.length);
                        if(gotNotifications.numChildren() === finalNotiArray.length){
                            if(!isProccessing){
                                console.log("resolving..."+JSON.stringify(finalNotiArray));
                                resolve(finalFunction());
                            }
                        }
                    return 0;
                    }).catch(err=>{
                        console.log("err in gettin user details "+err)
                        var status = {
                            code : 0,
                            msg : "err in gettin user details "
                        };
                        return res.status(200).json(status);
                    })
                })
               
            });
            //console.log("got response from getReplies "+JSON.stringify(userData));
        }
        else{
            var status = {
                code : 0,
                msg : "No comments found"
            };
            return res.status(200).json(status);
        }
    }).catch(err=>{
        var status = {
            code : 0,
            msg : "Error occured while get Comments of News"
        }
        console.log("error in getting comment list "+err)
        return res.status(500).json(status);
    })
})
