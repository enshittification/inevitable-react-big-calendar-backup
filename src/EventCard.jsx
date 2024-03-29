import React, { Component } from 'react';
import cn from 'classnames';
import { DragSource } from 'react-dnd';

import { ItemTypes } from './Constants';

const eventCardDragSource = {
  beginDrag( props ) {
    const event = props.event;

    return {
      ...event,
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
      onMouseDown,
      onMouseUp,
      classNamePostfix,
      label,
      eventComponent,
      isSelected,
      lastLeftOffset,
      connectDragSource,
      isDragging,
      event,
    } = this.props;

    const EventComponent = eventComponent;

    // FIXME: should be access via a new accessor.
    const calendarColorName = 'calendar-color-' + ( event.calendarId % 8 );

    return connectDragSource(
      <div
        style={style}
        title={label + ': ' + title }
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className={cn('rbc-event', calendarColorName, classNamePostfix, {
          'rbc-selected': isSelected,
          'rbc-event-overlaps': lastLeftOffset !== 0,
          'rbc-event-afk': event.state === 0, //FIXME: should be access via a new accessor.
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

export default DragSource( ItemTypes.EventCard, eventCardDragSource, collect )( EventCard );
