import {
	ArrowLeftOnRectangleIcon,
	ArrowPathIcon,
} from '@heroicons/react/24/solid'

import {
	Anchor,
	Avatar,
	Button,
	Divider,
	Menu,
	Modal,
	ScrollArea,
	TextInput,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Form, Link, Outlet, useFetcher} from '@remix-run/react'
import appConfig from 'app.config'
import * as React from 'react'
import {Footer} from '~/components/Footer'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {isAdmin, isParticipant, requireUserId} from '~/session.server'
import {useUser} from '~/utils/hooks'

export type OrganizerLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const organizerId = await requireUserId(request)

	if (await isAdmin(request)) {
		return redirect('/admin')
	} else if (await isParticipant(request)) {
		return redirect('/participant')
	}

	const events = await db.event.findMany({
		where: {
			organizerId,
		},
		include: {
			organizer: true,
			venue: true,
			orders: true,
		},
	})

	const venues = await db.venue.findMany({})

	return json({
		events,
		venues,
	})
}

export default function OrganizerAppLayout() {
	return (
		<div className="flex h-full flex-col">
			<HeaderComponent />
			<ScrollArea classNames={{root: 'flex-1 bg-gray-100'}}>
				<main>
					<Outlet />
				</main>
			</ScrollArea>
			<Footer />
		</div>
	)
}

function HeaderComponent() {
	const {user} = useUser()
	const fetcher = useFetcher()
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.type !== 'done') {
			return
		}

		if (!fetcher.data.success) {
			return
		}

		handleModal.close()
	}, [fetcher.data, fetcher.type, handleModal])

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="h-[100px] p-4">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-16 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										{user ? (
											<Avatar color="blue" size="md">
												{user.name.charAt(0)}
											</Avatar>
										) : (
											<Avatar />
										)}
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									<Menu.Item disabled>
										<div className="flex flex-col">
											<p>{user.name}</p>
											<p className="mt-0.5 text-sm">{user.email}</p>
										</div>
									</Menu.Item>
									<Divider />
									<Menu.Item
										icon={<ArrowPathIcon className="w- h-4 text-gray-700" />}
										onClick={() => handleModal.open()}
									>
										Reset Password
									</Menu.Item>

									<Menu.Item
										icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
										type="submit"
										form="logout-form"
									>
										Logout
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</header>

			<Modal
				opened={isModalOpen}
				onClose={handleModal.close}
				title="Reset Password"
				centered
				overlayBlur={1}
				overlayOpacity={0.5}
			>
				<fetcher.Form
					method="post"
					replace
					className="flex flex-col gap-4"
					action="/api/reset-password"
				>
					<div className="mt-6 grid grid-cols-2 gap-4">
						<input hidden name="userId" defaultValue={user.id} />
						<TextInput
							required
							name="password"
							type="password"
							placeholder="Password"
						/>

						<Button
							variant="filled"
							type="submit"
							fullWidth
							loading={isSubmitting}
							loaderPosition="right"
						>
							Reset
						</Button>
					</div>
				</fetcher.Form>
			</Modal>
		</>
	)
}
