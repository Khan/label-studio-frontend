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

// Note: We use a different marker than what is used in Khanmigo.
const MAJX_MARKER = '$';

// Extract math from conversation, alternate between math and non-math
// Khanmigo uses "\(.*?\)" as the marker for math
// For example, "What is \(2 + 2\)?" will split into ["What is ", "2 + 2", "?"]
const parseConvoWithMath = (str) => {
  // About the capture group:  a cool behaviour of str.split is that if there's
  // capturing group, the group is captured into the group, which is perfect
  // for us!
  const mathRegex = /\\\((.*?)\\\)/g;

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

  const itemClass = cn('richtext', { elem: 'table-item' });
  const questionItemClass = cn('richtext', { elem: 'table-item', mod: { qa : 'question' } });
  let hasMath = false;

  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[0];
    const answer = conversation[1];
    const mathQuestions = parseConvoWithMath(question);
    const mathAnswers = parseConvoWithMath(answer);
    let mathQuestionComponent = null;
    let mathAnswerComponent = null;

    // Render an alternate list between Math and non-math expressions
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
              <span data-skip-select='1'>{MAJX_MARKER + convo + MAJX_MARKER}</span>
            </span>
          );
        }
      })
    );

    if (mathQuestions.length > 1) {
      mathQuestionComponent = (
        <div className={questionItemClass}>
          <MathJax>{renderAllMathJax(mathQuestions)}</MathJax>
        </div>
      );
      hasMath = true;
    } else {
      mathQuestionComponent = <div className={questionItemClass}>{question}</div>;
    }
    if (mathAnswers.length > 1) {
      mathAnswerComponent = (
        <div className={itemClass}>
          <MathJax>{renderAllMathJax(mathAnswers)}</MathJax>
        </div>
      );
      hasMath = true;
    } else {
      mathAnswerComponent = <div className={itemClass}>{answer}</div>;
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
        inlineMath: [[MAJX_MARKER, MAJX_MARKER]],
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
const triggerMathJaxTypeset = () => {
  setTimeout(() => {
    // TODO: this is a hacky way to trigger MathJax typeset
    // The official way is to useContext(MathJaxBaseContext) but we are not
    // composing the component here.
    window?.MathJax?.typeset();
  });
};

export const TableText = () => (
  HtxRichText({
    isText: false,
    valueToComponent: renderTableValue,
    // TODO: do we need this to re-render?
    // didMountCallback: triggerMathJaxTypeset,
    alwaysInline: true,
  })
);

export const TableTextModel = types.compose('TableTextModel', RichTextModel);
