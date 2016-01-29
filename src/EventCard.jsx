import React, { Component } from 'react';
import cn from 'classnames';
import { DragSource } from 'react-dnd';

import { ItemTypes } from './Constants';

const eventCardDragSource = {
  beginDrag( props ) {
    return {
      id        : props.id,
      calendarId: props.calendarId,
      userId    : props.userId,
      start     : props.start,
      end       : props.end,
    };
  },
}

function collect( connect, monitor ) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}

class EventCard extends Component {
  render() {
    const {
      style,
      title,
      onClick,
      classNamePostfix,
      label,
      eventComponent,
      isSelected,
      lastLeftOffset,
      connectDragSource,
      isDragging,
    } = this.props;

    const EventComponent = eventComponent;

    return connectDragSource(
      <div
        style={style}
        title={label + ': ' + title }
        onClick={onClick}
        className={cn('rbc-event', classNamePostfix, {
          'rbc-selected': isSelected,
          'rbc-event-overlaps': lastLeftOffset !== 0
        })}
      >
        <div className='rbc-event-label'>{label}</div>
        <div className='rbc-event-content'>
          { EventComponent
            ? <EventComponent event={event} title={title}/>
            : title
          }
        </div>
      </div>
    );
  }
}

export default DragSource( ItemTypes.EventCell, eventCardDragSource, collect )( EventCard );