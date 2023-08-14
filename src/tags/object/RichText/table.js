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

// Extract math from conversation
// Khanmigo uses "\(.*?\)" as the marker for math
// TODO: only extract first match at the moment
const extractMaths = (str) => {
  const match = Array.from(str.matchAll(/\\\((.*?)\\\)/g));

  if (!match.length) return null;
  return match.map((m) => m[1]);
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
  const mathItemClass = cn('richtext', { elem: 'table-item', mod: { context: 'math' } });
  const questionMathItemClass = cn('richtext', { elem: 'table-item', mod: { qa : 'question', context: 'math' } });
  let hasMath = false;

  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[0];
    const answer = conversation[1];
    const mathQuestions = extractMaths(question);
    const mathAnswers = extractMaths(answer);
    let mathQuestionComponent = null;
    let mathAnswerComponent = null;

    const renderAllMathJax = (maths) => (
      maths.map((equation, i) => <MathJax key={`eq-${i}`}>{MAJX_MARKER + equation + MAJX_MARKER}</MathJax>)
    );

    if (mathQuestions) {
      mathQuestionComponent = (
        <div className={questionMathItemClass}>
          {renderAllMathJax(mathQuestions)}
        </div>
      );
      hasMath = true;
    }
    if (mathAnswers) {
      mathAnswerComponent = (
        <div className={mathItemClass}>
          {renderAllMathJax(mathAnswers)}
        </div>
      );
      hasMath = true;
    }

    return (
      <div key={`conversation-${index}`}>
        <div className={questionItemClass}>{question}</div>
        {mathQuestionComponent}
        <div className={itemClass}>{answer}</div>
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

export const TableText = () => (
  HtxRichText({
    isText: false,
    valueToComponent: renderTableValue,
    alwaysInline: true,
  })
);

export const TableTextModel = types.compose('TableTextModel', RichTextModel);
