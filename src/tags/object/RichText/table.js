/**
 * A component inherits from RichText HyperText component to render a conversation.
 *
 * This allows us to render the text in table format.
 */

import React from 'react';
import { inject, observer } from 'mobx-react';
import { types } from 'mobx-state-tree';
import { cn } from '../../../utils/bem';

import { RichTextModel } from './model';
import { RichTextPieceView } from './view';

const renderTableValue = (val) => {
  let conversations = [];

  try {
    conversations = JSON.parse(val);
  } catch (e) {
    const tdErrClass = cn('richtext', { elem: 'error-box' });
    const errMsg = `Couldn't parse JSON: ${e.message}`;

    console.error(errMsg);
    // Display red text box with error message
    return <div className={tdErrClass}>{errMsg}</div>;
  }

  const tdClass = cn('richtext', { elem: 'table-item' });

  // Loop through conversations and display each table item as a new table row
  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[1];
    const answer = conversation[2];

    return (
      <div key={`conversation-${index}`}>
        <div className={tdClass}>{question}</div>
        <div className={tdClass}>{answer}</div>
      </div>
    );
  });

  return <div>{rowElems}</div>;
};

const storeInjector = inject('store');

const RPTV = storeInjector(observer(RichTextPieceView));

// TODO: injecting more items into the props
export const TableText = ({ isText = false } = {}) => {
  return storeInjector(observer(props => {
    return <RPTV {...props} isText={isText} valueToComponent={renderTableValue} alwaysInline={true} />;
  }));
};

export const TableTextModel = types.compose('TableTextModel', RichTextModel);
