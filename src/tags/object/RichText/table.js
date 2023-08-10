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
import { cn } from '../../../utils/bem';

import './RichText.styl';
import { RichTextModel } from './model';
import { HtxRichText } from './view';

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

  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[0];
    const answer = conversation[1];

    return (
      <div key={`conversation-${index}`}>
        <div className={itemClass}>{question}</div>
        <div className={itemClass}>{answer}</div>
      </div>
    );
  });

  return <div>{rowElems}</div>;
};

export const TableText = () => (
  HtxRichText({
    isText: false,
    valueToComponent: renderTableValue,
    alwaysInline: true,
  })
);

// TODO: Another way to wrap RPTV
// export const TableText = () => {
//   return (props => {
//     return <RPTV {...props} isText={false} valueToComponent={renderTableValue} alwaysInline={true}/>;
//   });
// };

// This essentially create a RichTextModel but with different name.
export const TableTextModel = types.compose('TableTextModel', RichTextModel);
