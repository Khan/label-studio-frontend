/**
 * TableText component is a component which renders JSON data.
 *
 * The item data is expected to be JSON, which is then rendered in a speech
 * bubble format.
 *
 * This injects a renderTableValue function into the RichTextPieceView component.
 * Which allows us to convert the JSON data into HTML to allow us to directly
 * reuse the annotation features already built into the RichTextPieceView component.
 * Note that the focus on this is to minimize the editing / code copying from
 * RichTextPieceView, and hence we added two new props to the RichTextPieceView:
 *
 * - valueToComponent: a function that converts the JSON value to a React component
 * - alwaysInline: a boolean that indicates whether the component should always be inline
 *   since otherwise the component is rendered in separate IFrame which makes
 *   styling / LaTex rendering much more difficult.
 */

import React from 'react';
import { types } from 'mobx-state-tree';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { cn } from '../../../utils/bem';

import './RichText.styl';
import { RichTextModel } from './model';
import { HtxRichText } from './view';

// To allow us to render MathJax expressions, we need to use a marker
// However we also want to keep the original \(expressions\), so we swap into
// a differnet marker instead.
// We use a different marker than what is used in Khanmigo.
const MATHJAX_MARKER = '$';

// Extract math from conversation, alternate between math and non-math
// Khanmigo uses "\(.*?\)" and "\[.*?\]" as the marker for math
// For example, "What is \(2 + 2\)?" will split into ["What is ", "2 + 2", "?"]
const parseConvoWithMath = (str) => {
  // About the capture group:  a cool behaviour of str.split is that if there's
  // capturing group, the group is captured into the group, which is perfect
  // for us!
  const mathRegex = /\\[([](.*?)\\[)\]]/sg;

  return str.split(mathRegex);
};

const renderTableValue = (val) => {
  let conversations = [];

  try {
    conversations = JSON.parse(val);
  } catch (e) {
    // Display red text box with error message
    const errClass = cn('richtext', { elem: 'error-box' });
    const errMsg = `Couldn't parse JSON: ${e.message}`;

    console.error(errMsg);
    return <div className={errClass}>{errMsg}</div>;
  }

  const questionItemClass = cn('richtext', { elem: 'table-item', mod: { qa : 'question' } });
  const answerItemClass = cn('richtext', { elem: 'table-item', mod: { qa : 'answer' } });
  let hasMath = false;

  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[0];
    const answer = conversation[1];
    const mathQuestions = parseConvoWithMath(question);
    const mathAnswers = parseConvoWithMath(answer);
    let mathQuestionComponent = null;
    let mathAnswerComponent = null;

    // Render an alternate list between Math and non-math expressions
    // The list alternates between non-Math and Math expressions from
    // `parseConvoWithMath`
    const renderAllMathJax = (convoAndMathList) => (
      convoAndMathList.map((convo, i) => {
        if (i % 2 === 0) {
          // Non math
          return <span key={`eq=${i}`}>{convo}</span>;
        } else {
          // So for Math, we need to create a span as we want 2 piece of dom:
          // 1. The hidden raw MathJax expression, to allow slot Label to work
          // 2. A marked MathJax expression that allows <MathJax/> to render
          return (
            <span key={`eq-${i}`}>
              <span style={{ 'display': 'none' }}>{'\\(' + convo + '\\)'}</span>
              <span data-skip-select='1'>{MATHJAX_MARKER + convo + MATHJAX_MARKER}</span>
            </span>
          );
        }
      })
    );

    if (mathQuestions.length > 1) {
      mathQuestionComponent = (
        <div className={questionItemClass}>
          <MathJax dynamic>{renderAllMathJax(mathQuestions)}</MathJax>
        </div>
      );
      hasMath = true;
    } else if (question) {
      mathQuestionComponent = <div className={questionItemClass}>{question}</div>;
    }
    if (mathAnswers.length > 1) {
      mathAnswerComponent = (
        <div className={answerItemClass}>
          <MathJax dynamic>{renderAllMathJax(mathAnswers)}</MathJax>
        </div>
      );
      hasMath = true;
    } else if (answer){
      mathAnswerComponent = <div className={answerItemClass}>{answer}</div>;
    }

    return (
      <div key={`conversation-${index}`}>
        {mathQuestionComponent}
        {mathAnswerComponent}
      </div>
    );
  });

  if (hasMath) {
    const mathJaxConfig = {
      tex: {
        inlineMath: [[MATHJAX_MARKER, MATHJAX_MARKER]],
      },
    };

    return (
      <MathJaxContext config={mathJaxConfig}>
        {rowElems}
      </MathJaxContext>
    );
  }
  return <div>{rowElems}</div>;
};

// We need to trigger MathJax typeset after the component is mounted
// See https://docs.mathjax.org/en/latest/advanced/typeset.html
//
// As the document suggest above, we need to ensure that only one typeSet
// function is running at one time.  We use the promise to ensure that the
// typeset is only run once at a time.
//
// TODO: We should fix this in a better way.  This is executed via the useEffect
// within the <MathJax/> component However as we are rendering the MathJax
// component dynamically, somehow the useEffect is not triggered.  So we pass
// this to componentDidMount of the RichTextPieceView component.  This is also
// why the `renderMode=pre` would not work.
let typesetPromise = null;

const triggerMathJaxTypeset = () => {
  setTimeout(() => {
    // This means that we already have a typeset running.
    if (typesetPromise) return;

    // This means that this is first load, and we can wait for
    // <MathJaxContext/> component to be ready and typeset, instead of doing
    // this dynamically.
    if (typeof window?.MathJax?.typesetPromise !== 'function') return;

    typesetPromise = window.MathJax.typesetPromise();

    typesetPromise.catch((err) => {
      console.error('MathJax Typeset failed:', err);
      // We have seen this happen on Firefox, where the typeset fails.
      // Best bet is to clear the typeset and try again.
      window.MathJax.typesetClear();
      typesetPromise = null;
      triggerMathJaxTypeset();
    }).then(() => {
      console.log('MathJax Typeset success!');
      typesetPromise = null;
    });

  }, 100);
};

export const TableText = () => (
  HtxRichText({
    isText: false,
    valueToComponent: renderTableValue,
    didMountCallback: triggerMathJaxTypeset,
    alwaysInline: true,
  })
);

export const TableTextModel = types.compose('TableTextModel', RichTextModel);
