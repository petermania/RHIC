$(document).ready(function(){
  $("#dropdown-response > button").on("click", function(e){
    console.log("clicked")
      currentValue=this.innerHTML()
    $('.dropdown').removeClass("open")
    e.stopPropagation();
    e.preventDefault();
  });
});
