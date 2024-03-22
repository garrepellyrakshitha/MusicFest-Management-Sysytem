import {OrderStatus, PaymentStatus} from '@prisma/client'
import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {db} from '~/db.server'

export const action = async ({request}: ActionArgs) => {
	const formData = await request.formData()

	const orderId = formData.get('orderId')?.toString()

	if (!orderId) {
		return json({success: false, message: 'Order ID is required'})
	}

	await db.order.update({
		where: {
			id: orderId,
		},
		data: {
			status: OrderStatus.CANCELLED_BY_PARTICIPANT,
			payment: {
				update: {
					status: PaymentStatus.REFUNDED,
				},
			},
		},
	})

	return json({success: true})
}
