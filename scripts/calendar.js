const ical = require("ical");
const fs = require("fs");
const moment = require("moment");
const calendars = require("../settings/calendars");

const getAll = () => {
	let calPromises = calendars.map( (cal, calIndex) => {
		if(cal.active) {
			return get( calIndex ).catch( ( err ) => {
				console.log( cal.title + "\t:\t" + err + "\n-\t" + cal.url );
			} );
		}
	});
	return Promise.all(calPromises);
};
const get = (calIndex) => {
	let {title,className,background,color,url} = calendars[calIndex];
	return new Promise((resolve, reject) => {
		ical.fromURL(url,null,(err,data) => {
			if(err){
				reject(err);
			}else {
				const startOfMonth = getStartDate();
				const endOfMonth = getEndDate();
				const events = [];
				for ( let e in data ) {
					const {start,end,rrule,summary,type,location} = data[e];
					const event = {
						start : moment(start),
						end : moment(end),
						summary,
						location,
						isFullDay : false,
						isMultiDay : false,
						duration : 0,
						calendar : title,
						className,
						background,
						color
					};
					if (type === "VEVENT"){
						let eventDuration = moment.duration(event.end.diff(event.start));
						event.duration = eventDuration.humanize();
						event.isFullDay = eventDuration.asDays() === 1;
						event.isMultiDay = eventDuration.asDays() >= 2;
						if(typeof rrule !== 'undefined'){
							let rDates = rrule.between(startOfMonth.toDate(),endOfMonth.toDate(),true,limitFunction);
							rDates.forEach( (rDate) => {
								const rStartDate = moment(rDate);
								const rEndDate = rStartDate.clone().add(eventDuration);
								let newEvent = Object.assign({},event);
								newEvent.start = rStartDate;
								newEvent.end = rEndDate;
								events.push(newEvent);
							});
						}
						else{
							if( event.start.isBetween( startOfMonth, endOfMonth )) {
								if(event.isMultiDay) {
									const mStartDate = event.start.clone();
									while ( mStartDate.isBefore( event.end ) ) {
										const newEvent = Object.assign({}, event );
										newEvent.start = mStartDate.clone();
										newEvent.end = mStartDate.clone().add( 1, 'day' );
										events.push( newEvent );
										mStartDate.add( 1, 'day' );
									}
								}else {
									events.push( event );
								}
							}
						}
					}
				}
				resolve(events);
			}
		});
	});
};
const getStartDate = () => {
	return moment().add(0,'month').startOf('month').startOf('week');
};
const getEndDate = () => {
	return getStartDate().add(35,'day');//moment().add(0,'month').endOf('month').endOf('week');
};
const getTodaysDate = () => {
	return moment();
}

const limitFunction = (d, i) => {
	let date = moment(d);
	return date.isBetween(getStartDate(),getEndDate());
};
const sortEvents = ( eventA, eventB ) => {
	let startA = eventA.start;
	let startB = eventB.start;
	if ( startA.isSame( startB, 'day' ) ) {
		if ( eventA.calendar === "KareDare" && eventB.calendar !==
			"KareDare" ) {
			return -1;
		}
		if ( eventA.calendar === "Birthdays & Anniversaries" &&
			eventB.calendar !== "Birthdays & Anniversaries" ) {
			return -1;
		}
		if ( eventB.calendar === "KareDare" && eventA.calendar !==
			"KareDare" ) {
			return 1;
		}
		if ( eventB.calendar === "Birthdays & Anniversaries" &&
			eventA.calendar !== "Birthdays & Anniversaries" ) {
			return 1;
		}
		return 0;
	} else if ( startA.isBefore( startB, 'day' ) ) {
		return -1;
	} else {
		return 1;
	}
};
module.exports = {
	getAll,
	get,
	getStartDate,
	getEndDate,
	getTodaysDate,
	sortEvents,
	calendars: calendars,
};