import {EventStatus, OrderStatus, UserRole} from '@prisma/client'

export function round(number: number, precision: number) {
	const d = Math.pow(10, precision)
	return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
	string = string.toLowerCase()
	const wordsArray = string.split(' ')

	for (var i = 0; i < wordsArray.length; i++) {
		wordsArray[i] =
			wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
	}

	return wordsArray.join(' ')
}

export function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(new Date(date))
}

export function formatTime(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: '2-digit',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date))
}

export function formatList(list: Array<string>) {
	return new Intl.ListFormat('en').format(list)
}

export function formatCurrency(amount: number) {
	return new Intl.NumberFormat('en', {
		style: 'currency',
		currency: 'USD',
	}).format(amount)
}

export function orderStatusLookup(status: OrderStatus) {
	return {
		[OrderStatus.SUCCESS]: 'Success',
		[OrderStatus.CANCELLED_BY_ADMIN]: 'Cancelled by Admin',
		[OrderStatus.CANCELLED_BY_ORGANIZER]: 'Cancelled by Organizer',
		[OrderStatus.CANCELLED_BY_PARTICIPANT]: 'Cancelled by Participant',
	}[status]
}

export function userRoleLookup(role: UserRole) {
	return {
		[UserRole.ADMIN]: 'Admin',
		[UserRole.PARTICIPANT]: 'Participant',
		[UserRole.ORGANIZER]: 'Organizer',
	}[role]
}

export function combineDateAndTime(date: string, time: string) {
	const dateTimeString = date + ' ' + time + ':00'
	return new Date(dateTimeString)
}

export function eventStatusLookup(status: EventStatus) {
	return {
		[EventStatus.SUCCESS]: 'Success',
		[EventStatus.CANCELLED]: 'Cancelled',
	}[status]
}

export function eventStatusColorLookup(status: EventStatus) {
	return {
		[EventStatus.SUCCESS]: 'green',
		[EventStatus.CANCELLED]: 'red',
	}[status]
}
