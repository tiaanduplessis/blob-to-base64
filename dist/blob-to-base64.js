var e,o=(e=require("is-blob"))&&"object"==typeof e&&"default"in e?e.default:e;module.exports=function(e,r){window.FileReader||r(new Error("no fileReader object available")),o(e)||r(new Error("provided argument is not blob"));var n=new window.FileReader;n.readAsDataURL(e),n.onloadend=function(){r(null,n.result)}};
//# sourceMappingURL=blob-to-base64.js.map
