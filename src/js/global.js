// define variables and function shared across all charts
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parseDate = d3.timeParse("%Y-%m");
const formatDate = d3.timeFormat("%B %Y");

// extend d3.js with functions to move an SVG element
// to front and back within its group of sibling elements
// http://stackoverflow.com/a/14426477
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  }); 
};