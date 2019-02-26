import e from"is-blob";export default function(o,r){window.FileReader||r(new Error("no fileReader object available")),e(o)||r(new Error("provided argument is not blob"));var n=new window.FileReader;n.readAsDataURL(o),n.onloadend=function(){r(null,n.result)}}
//# sourceMappingURL=blob-to-base64.mjs.map
