// ==Bookmarklet==
// @name Test
// @author Peter
// @script https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/Bookmarklet==

var $ = jQuery.noConflict(true),
    pCount = $('p').size(),
    divCount = $('div').size();

alert('p tags: ' + pCount + '\ndiv tags: ' + divCount);
