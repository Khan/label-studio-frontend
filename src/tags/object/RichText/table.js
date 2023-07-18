/**
 * A component inherits from RichText HyperText component to render a conversation.
 *
 * This allows us to render the text in table format.
 */

import React from 'react';
import { inject, observer } from 'mobx-react';

import { RichTextPieceView } from './view';

const renderTableValue = (val) => {
  let conversations = [];

  try {
    conversations = JSON.parse(val);
  } catch (e) {
    const errMsg = `Couldn't parse JSON: ${e.message}`;

    console.error(errMsg);
    // Display red text box with error message
    return <div style={{ color: 'red' }}>{errMsg}</div>;
  }

  // Loop through conversations and display each table item as a new table row
  const rowElems = conversations.map((conversation, index) => {
    const question = conversation[1];
    const answer = conversation[2];

    return (
      <tr key={`conversation-${index}`}>
        <td>{question}</td>
        <td>{answer}</td>
      </tr>
    );
  });

  return <table>{rowElems}</table>;
};

const storeInjector = inject('store');

const RPTV = storeInjector(observer(RichTextPieceView));

// TODO: injecting more items into the props
export const TableText = ({ isText = false } = {}) => {
  return storeInjector(observer(props => {
    return <RPTV {...props} isText={isText} valueToComponent={renderTableValue}/>;
  }));
};
