import React from 'react';
import cn from 'classnames';
import { findDOMNode } from 'react-dom';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import dates from './utils/dates';
import localizer from './localizer'

import DaySlot from './DaySlot';
import EventRow from './EventRow';
import TimeGutter from './TimeGutter';
import BackgroundCells from './BackgroundCells';
import TimezoneButton from './TimezoneButton';

import classes from 'dom-helpers/class';
import getWidth from 'dom-helpers/query/width';
import scrollbarSize from 'dom-helpers/util/scrollbarSize';
import message from './utils/messages';

import { dateFormat} from './utils/propTypes';

import { notify } from './utils/helpers';
import { navigate } from './utils/constants';
import { accessor as get } from './utils/accessors';

import { inRange, eventSegments, eventLevels, sortEvents, segStyle } from './utils/eventLevels';

const MIN_ROWS = 2;

let TimeGrid = React.createClass({

  propTypes: {
    ...DaySlot.propTypes,
    ...TimeGutter.propTypes,

    step: React.PropTypes.number,
    min: React.PropTypes.instanceOf(Date),
    max: React.PropTypes.instanceOf(Date),
    dayFormat: dateFormat,
    rtl: React.PropTypes.bool
  },

  getDefaultProps(){
    return {
      step: 30,
      min: dates.startOf(new Date(), 'day'),
      max: dates.endOf(new Date(), 'day')
    }
  },

  componentWillMount() {
    this._gutters = [];
    this._timeGutters = [];
  },

  componentDidMount() {
    this._adjustGutter();
    this._tellCurrentPadding();
  },

  componentDidUpdate() {
    this._adjustGutter();
    this._tellCurrentPadding();
  },

  render() {
    let {
      events,
      start,
      end,
      messages,
      showDateHeader,
      timezoneCheckStatus,
      availableTimezones,
      startAccessor,
      endAccessor,
      allDayAccessor,
    } = this.props;

    let range = dates.range(start, end, 'day')

    this._slots = range.length;

    let allDayEvents = []
      , rangeEvents = [];

    events.forEach(event => {
      if (inRange(event, start, end, this.props)) {
        let eStart = get(event, startAccessor)
          , eEnd = get(event, endAccessor);

        if (
             get(event, allDayAccessor)
          || !dates.eq(eStart, eEnd, 'day')
          || (dates.isJustDate(eStart) && dates.isJustDate(eEnd)))
        {
          allDayEvents.push(event)
        }
        else
          rangeEvents.push(event)
      }
    })

    allDayEvents.sort((a, b) => sortEvents(a, b, this.props))

    let segments = allDayEvents.map(evt => eventSegments(evt, start, end, this.props))
    let { levels } = eventLevels(segments)

    const checkedTimezones = availableTimezones.filter( ( timezone, index ) => timezoneCheckStatus[ index ] );

    return (
      <div className='rbc-time-view'>
        <div ref='headerCell' className='rbc-time-header'>
          <div className='rbc-row'>
            { this.renderTimezoneHeaders( checkedTimezones ) }
            { showDateHeader && this.renderHeader(range) }
          </div>
        </div>
        <div ref='content' className='rbc-time-content'>
          { this.renderTimeGutters( checkedTimezones ) }
          {
            this.renderEvents(range, rangeEvents)
          }
        </div>
      </div>
    );
  },

  renderTimeGutters( checkedTimezones ) {
    const addRef = memo => i => ref => {
      if ( null == ref ) {
        memo.splice( i, 1 );
      } else {
        memo[i] = ref;
      }
    };

    const renderTimeGutter = ( timezoneName, index ) => {
      return(
        <div ref={addRef( this._gutters )( index )} className='rbc-gutter-cell' key={index}>
          <TimeGutter ref={addRef( this._timeGutters )( index )}
            timezoneName={timezoneName}
            {...this.props}
          />
        </div>
      );
    }

    return checkedTimezones.map( renderTimeGutter );
  },

  renderTimezoneHeaders( checkedTimezones ) {
    const {
      timezoneCheckStatus,
      availableTimezones,
      onCheckTimezone,
    } = this.props;

    return checkedTimezones.map( ( timezoneName, index ) => {
      return (
        <TimezoneButton key={index}
          timezoneName={timezoneName}
          timezoneCheckStatus={timezoneCheckStatus}
          availableTimezones={availableTimezones}
          onCheckTimezone={onCheckTimezone}
        />
      );
    } );
  },

  renderEvents(range, events){
    let { min, max, endAccessor, startAccessor, components } = this.props;
    let today = new Date();

    return range.map((date, idx) => {
      let daysEvents = events.filter(
        event => dates.inRange(date,
          get(event, startAccessor),
          get(event, endAccessor), 'day')
      )

      return (
        <DaySlot
          {...this.props }
          min={dates.merge(date, min)}
          max={dates.merge(date, max)}
          eventComponent={components.event}
          className={cn({ 'rbc-now': dates.eq(date, today, 'day') })}
          style={segStyle(1, this._slots)}
          key={idx}
          date={date}
          events={daysEvents}
        />
      )
    })
  },

  renderAllDayEvents(range, levels){
    let first = range[0]
      , last = range[range.length - 1];

    while (levels.length < MIN_ROWS )
      levels.push([])

    return levels.map((segs, idx) =>
      <EventRow
        eventComponent={this.props.components.event}
        titleAccessor={this.props.titleAccessor}
        startAccessor={this.props.startAccessor}
        endAccessor={this.props.endAccessor}
        allDayAccessor={this.props.allDayAccessor}
        onSelect={this._selectEvent}
        slots={this._slots}
        key={idx}
        segments={segs}
        start={first}
        end={last}
      />
    )
  },

  renderHeader(range){
    let { dayFormat, culture } = this.props;
    const now = new Date();

    return range.map((date, i) =>
      <div key={i}
        className={ cn('rbc-header',{'today': dates.sameDay(date, now)}) }
        style={segStyle(1, this._slots)}
      >
        <a href='#' onClick={this._headerClick.bind(null, date)}>
          { localizer.format(date, dayFormat, culture) }
        </a>
      </div>
    )
  },

  _headerClick(date, e){
    e.preventDefault()
    notify(this.props.onNavigate, [navigate.DATE, date])
  },

  _selectEvent(...args){
    notify(this.props.onSelectEvent, args)
  },

  _adjustGutter() {
    let isRtl = this.props.rtl;
    let header = this.refs.headerCell;
    let width = this._gutterWidth
    let timeGutterNodes = this._timeGutters.map( ( timeGutter ) => findDOMNode( timeGutter ) );
    let gutterCells = [ ...timeGutterNodes, ...this._gutters ]
    let isOverflowing = this.refs.content.scrollHeight > this.refs.content.clientHeight;

    if (width)
      gutterCells.forEach(
        node => node.style.width = '');

    this._gutterWidth = Math.max(...gutterCells.map(getWidth));

    if (this._gutterWidth && width !== this._gutterWidth) {
      width = this._gutterWidth + 'px';
      gutterCells.forEach(node => node.style.width = width)
    }

    if (isOverflowing) {
      classes.addClass(header, 'rbc-header-overflowing')
      this.refs.headerCell.style[!isRtl ? 'marginLeft' : 'marginRight'] = '';
      this.refs.headerCell.style[isRtl ? 'marginLeft' : 'marginRight'] = scrollbarSize() + 'px';
    } else {
      classes.removeClass(header, 'rbc-header-overflowing')
    }
  },

  _tellCurrentPadding() {
    const {
      currentGutterPadding,
      onGutterUpdate,
    } = this.props;

    const numGutter = this._gutters.length;
    const lastGutterNode = findDOMNode( this._gutters[ numGutter - 1 ] );
    const newPadding = lastGutterNode.getBoundingClientRect().right;

    if ( newPadding !== currentGutterPadding ) {
      this.props.onGutterUpdate( newPadding );
    }
  },

});

export default DragDropContext( HTML5Backend )( TimeGrid );
