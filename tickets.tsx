import {ArrowLeftIcon, PlusIcon} from '@heroicons/react/24/solid'
import {
	Badge,
	Button,
	Group,
	Modal,
	NumberInput,
	Select,
	Text,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Event} from '@prisma/client'
import {OrderStatus} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {requireUserId} from '~/session.server'
import {useParticipantData} from '~/utils/hooks'
import {
	eventStatusColorLookup,
	formatCurrency,
	formatDateTime,
	orderStatusLookup,
} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

const CreateOrderSchema = z.object({
	eventId: z.string().min(1, 'EventId is required'),
	amount: z.string().min(1, 'Amount is required').transform(Number),
	noOfTickets: z.preprocess(
		Number,
		z.number().min(1, 'No of tickets is required')
	),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof CreateOrderSchema>
}

export const action: ActionFunction = async ({request}) => {
	const participantId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(request, CreateOrderSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	return db.order
		.create({
			data: {
				eventId: fields.eventId,
				participantId,
				status: OrderStatus.SUCCESS,
				noOfTickets: fields.noOfTickets,
				payment: {
					create: {
						amount: fields.amount * fields.noOfTickets,
						method: 'CREDIT_CARD',
						participantId,
					},
				},
			},
		})
		.then(() => json<ActionData>({success: true}))
		.catch(error => {
			console.error(error)
			return badRequest<ActionData>({success: false})
		})
}

export default function ManageOrders() {
	const fetcher = useFetcher<ActionData>()
	const {events, orders} = useParticipantData()
	const [isModalOpen, handleModal] = useDisclosure(false)

	const upcomingEvents = React.useMemo(
		() =>
			events.filter(
				event =>
					event.status !== 'CANCELLED' && new Date(event.start) > new Date()
			),
		[events]
	)

	const [selectedEventId, setSelectedEventId] = React.useState<
		Event['id'] | null
	>(upcomingEvents[0]?.id ?? null)
	const [selectedEvent, setSelectedEvent] = React.useState<
		typeof events[number] | null
	>(null)
	const [noOfTickets, setNoOfTickets] = React.useState<number>(1)
	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (!selectedEventId) return
		setSelectedEvent(events.find(event => event.id === selectedEventId) ?? null)
	}, [selectedEventId, events])

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	// const selectedEventTicketSales = React.useMemo(() => {
	// 	const successfulTickets = selectedEvent?.tickets.filter(
	// 		ticket => ticket.status === OrderStatus.SUCCESS
	// 	)

	// 	if (!successfulTickets) return 0

	// 	return successfulTickets.reduce(total => total + 1, 0)
	// }, [selectedEvent?.tickets])

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<Button
								leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
								variant="white"
								size="md"
								component={Link}
								to=".."
								pl={0}
								mb={20}
								color="gray"
							>
								Back
							</Button>
							<h1 className="text-3xl font-semibold text-gray-900">
								Manage Tickets
							</h1>
							<p className="mt-2 text-sm text-gray-700">
								A list of all the events you have bought tickets for.
							</p>
						</div>
						<div>
							<Button
								loading={isSubmitting}
								loaderPosition="left"
								onClick={() => handleModal.open()}
							>
								<PlusIcon className="h-4 w-4" />
								<span className="ml-2">Buy ticket</span>
							</Button>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Event
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Date
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												No of tickets
											</th>

											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Event Status
											</th>

											<th
												scope="col"
												className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
											>
												Amount
											</th>

											<th
												scope="col"
												className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
											>
												Order Status
											</th>

											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{orders.map(ticket => (
											<OrderRow order={ticket} key={ticket.id} />
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<Modal
				opened={isModalOpen}
				onClose={() => handleModal.close()}
				title="Buy tickets"
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input hidden name="amount" defaultValue={selectedEvent?.price} />
						<Select
							name="eventId"
							label="Event"
							itemComponent={SelectItem}
							value={selectedEventId}
							onChange={e => setSelectedEventId(e)}
							data={upcomingEvents.map(event => ({
								start: event.start,
								end: event.end,
								address: event.venue.address,
								label: event.name,
								value: event.id,
							}))}
							error={fetcher.data?.fieldErrors?.eventId}
							required
						/>

						<NumberInput
							name="noOfTickets"
							label="Number of tickets"
							min={1}
							required
							value={noOfTickets}
							onChange={e => {
								if (!e) return setNoOfTickets(1)
								setNoOfTickets(e)
							}}
							error={fetcher.data?.fieldErrors?.noOfTickets}
						/>

						{/* <p className="text-sm">
							Available Seats:{' '}
							{selectedEvent?.tickets.length! - selectedEventTicketSales}
						</p> */}

						<p className="text-sm">
							Price: {formatCurrency(selectedEvent?.price! * noOfTickets)}
						</p>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => handleModal.close()}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Buy tickets
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}

function OrderRow({
	order,
}: {
	order: ReturnType<typeof useParticipantData>['orders'][0]
}) {
	const fetcher = useFetcher()

	const isTicketValid = order.status === OrderStatus.SUCCESS
	const isSubmitting = fetcher.state !== 'idle'

	return (
		<tr key={order.id}>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
				<div className="font-medium text-gray-900">
					<p>{order.event.name}</p>
					<p>{order.event.venue.address}</p>
				</div>
			</td>

			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
				<p>{formatDateTime(order.event.start)}</p>
				<p>{formatDateTime(order.event.end)}</p>
			</td>

			<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
				{order.noOfTickets}
			</td>

			<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
				<Badge color={eventStatusColorLookup(order.event.status)}>
					{order.event.status}
				</Badge>
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				{formatCurrency(order.payment?.amount!)}
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				<Badge
					className="max-w-min"
					variant="dot"
					fullWidth={false}
					color="blue"
				>
					{orderStatusLookup(order.status)}
				</Badge>
			</td>

			<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
				<Button
					variant="white"
					compact
					color="red"
					loaderPosition="right"
					loading={isSubmitting}
					disabled={!isTicketValid}
					onClick={() =>
						fetcher.submit(
							{
								orderId: order.id,
							},
							{
								method: 'post',
								replace: true,
								action: '/api/tickets/cancel',
							}
						)
					}
				>
					Cancel
				</Button>
			</td>
		</tr>
	)
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
	start: string
	end: string
	address: string
	label: string
}

const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
	(props: ItemProps, ref) => {
		const {start, end, address, label, ...others} = props
		return (
			<div ref={ref} {...others}>
				<Group noWrap>
					<div>
						<Text size="sm">{label}</Text>
						<Text size="xs" opacity={0.65}>
							{address}
						</Text>
						<Text size="xs" opacity={0.65}>
							{formatDateTime(start)} - {formatDateTime(end)})
						</Text>
					</div>
				</Group>
			</div>
		)
	}
)
