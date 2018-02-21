// ==Bookmarklet==
// @name Test
// @author Peter
// @style data:text/css,imaginary%7Bfont-family%3A%20%22ok%22%7D
// @script https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/Bookmarklet==

const $ = jQuery.noConflict(true);
const pCount = $('p').size();
const divCount = $('div').size();
const testElement = $('<imaginary>').appendTo('body');
const testPassed = testElement.css('font-family') === 'ok';

testElement.remove();

let run = () => {
  alert(
    'p tags: ' +
      pCount +
      '\ndiv tags: ' +
      divCount +
      '\nDid the test element get styled? ' +
      (testPassed ? 'Of course!' : 'Nope.')
  );
};

run();
