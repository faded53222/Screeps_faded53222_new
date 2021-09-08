const C=(arr)=>[].concat(...arr);
const R=(arr,repeats)=>[].concat([].concat(...Array.from({length:repeats},()=>arr)));
var num=2,A=C([R(['WORK'],num),R(['CARRY','MOVE'],num)]);;
console.log(A);