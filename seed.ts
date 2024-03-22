import {PrismaClient} from '@prisma/client'
import {createPasswordHash} from '~/utils/misc.server'

const db = new PrismaClient()
/**
 * Football teams and stadiums are seeded from the data in the seed.ts file.
 */
async function seed() {
	await db.user.deleteMany()
	await db.event.deleteMany()
	await db.payment.deleteMany()
	await db.venue.deleteMany()
	await db.order.deleteMany()
	await db.ticket.deleteMany()

	const admin = await db.user.create({
		data: {
			name: 'Admin',
			email: 'admin@app.com',
			password: await createPasswordHash('password'),
			role: 'ADMIN',
		},
	})

	const participant = await db.user.create({
		data: {
			name: 'Participant',
			email: 'participant@app.com',
			password: await createPasswordHash('password'),
			role: 'PARTICIPANT',
		},
	})

	const organizer = await db.user.create({
		data: {
			name: 'Organizer',
			email: 'organizer@app.com',
			password: await createPasswordHash('password'),
			role: 'ORGANIZER',
		},
	})

	const venue = await db.venue.create({
		data: {
			name: 'Venue',
			address: 'Address',
			maxCapacity: 100,
		},
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await db.$disconnect()
	})
