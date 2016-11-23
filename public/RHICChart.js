$(document).ready(function(){
  $("#dropdown-response > button").on("click", function(e){
    if(this.innerHTML==2){
      console.log(this.innerHTML)
      $('.three').hide()
      $('.text3').val('')
      $('.four').hide()
      $('.text4').val('')
      $('.response_no').val(2)
    }
    else if(this.innerHTML==3){
      console.log(this.innerHTML)
      $('.three').show()
      $('.four').hide()
      $('.text4').val('')
      $('.response_no').val(3)
    }
    else if(this.innerHTML==4){
      console.log(this.innerHTML)
      $('.three').show()
      $('.four').show()
      $('.response_no').val("4")
    }
    $('.dropdown').removeClass("open")
    e.stopPropagation();
    e.preventDefault();
  });
});
