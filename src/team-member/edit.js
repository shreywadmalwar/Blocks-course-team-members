import { useEffect, useState, useRef } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	MediaPlaceholder,
	BlockControls,
	MediaReplaceFlow,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { usePrevious } from '@wordpress/compose';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
	DndContext,
	DndCourse,
	useSensor,
	useSensors,
	PointerSensor,
} from '@dnd-kit/core';
import {
	SortableContext,
	horizontalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable';
import SortableItems from './sortable-item';
import {
	Spinner,
	withNotices,
	ToolbarButton,
	PanelBody,
	TextareaControl,
	SelectControl,
	Icon,
	Tooltip,
	TextControl,
	Button,
} from '@wordpress/components';

function Edit({
	attributes,
	setAttributes,
	noticeOperations,
	noticeUI,
	isSelected,
}) {
	const [blobURL, setBlobURL] = useState();
	const [selectedLink, setSelectedLink] = useState();

	const { name, bio, url, alt, id, sociallinks } = attributes;

	const preUrl = usePrevious(url);
	const preIsSelected = usePrevious(isSelected);

	const onChangeName = (newName) => {
		setAttributes({ name: newName });
	};

	const onChangeBio = (newBio) => {
		setAttributes({ bio: newBio });
	};
	const onChangeImage = (image) => {
		if (!image || !image.url) {
			setAttributes({ url: undefined, id: undefined, alt: '' });
		}
		setAttributes({ url: image.url, id: image.id, alt: image.alt });
	};

	const onChangeURL = (newURL) => {
		setAttributes({ url: newURL, id: undefined, alt: '' });
	};

	const onChangeNotice = (message) => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(message);
	};

	const onChangeRemoveImage = () => {
		setAttributes({
			url: undefined,
			id: undefined,
			alt: '',
		});
	};

	const onChangeALT = (newALT) => {
		[setAttributes({ alt: newALT })];
	};

	const imageObject = useSelect(
		(select) => {
			const { getMedia } = select('core');
			return id ? getMedia(id) : null;
		},
		['id']
	);

	const imageSizes = useSelect((select) => {
		return select(blockEditorStore).getSettings().imageSizes;
	}, []);

	const getImageSizeOptions = () => {
		if (!imageObject) return [];
		const options = [];
		const sizes = imageObject.media_details.sizes;

		for (const key in sizes) {
			const size = sizes[key];
			const imageSize = imageSizes.find((s) => s.slug == key);

			if (imageSize) {
				options.push({
					label: imageSize.name,
					value: size.source_url,
				});
			}
		}

		return options;
	};

	const onChangeImageSize = (newURL) => {
		setAttributes({ url: newURL });
	};

	const titleRef = useRef();

	const addNewSocialButton = () => {
		setAttributes({
			sociallinks: [...sociallinks, { icon: 'wordpress', link: '' }],
		});
		setSelectedLink(sociallinks.length);
	};

	const updateSocialLinks = (type, value) => {
		const socialLinksCopy = [...sociallinks];
		socialLinksCopy[selectedLink][type] = value;
		setAttributes({ sociallinks: socialLinksCopy });
	};

	const onRemoveSocialLink = () => {
		setAttributes({
			sociallinks: [
				...sociallinks.slice(0, selectedLink),
				...sociallinks.slice(selectedLink + 1),
			],
		});
		setSelectedLink();
		// console.log(sociallinks.slice(0, selectedLink));
		// console.log(sociallinks.slice(selectedLink + 1));
		// console.log(selectedLink);
		console.log(sociallinks);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	);

	const onDrag = (event) => {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = sociallinks.findIndex(
				(i) => active.id == `${i.icon}-${i.link}`
			);
			const newIndex = sociallinks.findIndex(
				(i) => over.id == `${i.icon}-${i.link}`
			);

			setAttributes({
				sociallinks: arrayMove(sociallinks, oldIndex, newIndex),
			});

			setSelectedLink(newIndex);
		}
	};

	useEffect(() => {
		if (!id && isBlobURL(url)) {
			setAttributes({
				url: undefined,
				alt: '',
			});
		}
	}, []);

	useState(() => {
		if (isBlobURL(url)) {
			setBlobURL(url);
		} else {
			revokeBlobURL(blobURL);
		}
	}, []);

	useEffect(() => {
		if (url && !preUrl && isSelected) {
			titleRef.current.focus();
		}
	}, [url, preUrl]);

	useEffect(() => {
		if (preIsSelected && !isSelected) {
			setSelectedLink();
		}
	}, [isSelected, preIsSelected]);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Image Settings', 'team-members')}>
					{id && (
						<SelectControl
							label={__('Image Size', 'team-members')}
							options={getImageSizeOptions()}
							value={url}
							onChange={onChangeImageSize}
						/>
					)}
					{url && !isBlobURL(url) && (
						<TextareaControl
							label={__('Alt text', 'team-members')}
							value={alt}
							onChange={onChangeALT}
							help={__(
								'Change you alt text here',
								'team-members'
							)}
						/>
					)}
				</PanelBody>
			</InspectorControls>
			{url && (
				<BlockControls group="inline">
					<MediaReplaceFlow
						onSelect={onChangeImage}
						onSelectURL={onChangeURL}
						onError={onChangeNotice}
						accept="/image/*"
						allowedTypes={['image']}
						mediaId={id}
						mediaURL={url}
					/>
					<ToolbarButton onClick={onChangeRemoveImage}>
						{__('Remove Image', 'team-members')}
					</ToolbarButton>
				</BlockControls>
			)}
			<div {...useBlockProps()}>
				{url && (
					<div
						className={`wp-block-blocks-course-team-member-img${
							isBlobURL(url) ? ' is-loading' : ''
						}`}
					>
						<img src={url} alt={alt} />
						{isBlobURL(url) && <Spinner />}
					</div>
				)}
				<MediaPlaceholder
					name={__('Replace Image', 'team-members')}
					icon="admin-users"
					onSelect={onChangeImage}
					onSelectURL={onChangeURL}
					onError={onChangeNotice}
					accept="/image/*"
					allowedTypes={['image']}
					disableMediaButtons={url}
					notices={noticeUI}
				/>
				<RichText
					ref={titleRef}
					placeholder={__('Member Name', 'team-member')}
					tagName="h4"
					onChange={onChangeName}
					value={name}
					allowedFormats={[]}
				/>
				<RichText
					placeholder={__('Member Bio', 'team-member')}
					tagName="p"
					onChange={onChangeBio}
					value={bio}
					allowedFormats={[]}
				/>
				<div className="wp-block-blocks-course-team-member-social-links">
					<ul>
						<DndContext
							sensors={sensors}
							onDragEnd={onDrag}
							modifiers={[restrictToHorizontalAxis]}
						>
							<SortableContext
								items={sociallinks.map(
									(item) => `${item.icon}-${item.link}`
								)}
								strategy={horizontalListSortingStrategy}
							>
								{sociallinks.map((item, index) => {
									return (
										<SortableItems
											key={`${item.icon}-${item.link}`}
											id={`${item.icon}-${item.link}`}
											index={index}
											selectedLink={selectedLink}
											setSelectedLink={setSelectedLink}
											icon={item.icon}
										/>
									);
								})}
							</SortableContext>
						</DndContext>

						{isSelected && (
							<li className="wp-block-blocks-course-team-member-add-icon-li">
								<Tooltip
									text={__('Add social Link', 'team-members')}
								>
									<button
										aria-label={__(
											'Add social Link',
											'team-members'
										)}
										onClick={addNewSocialButton}
									>
										<Icon icon="plus" />
									</button>
								</Tooltip>
							</li>
						)}
					</ul>
				</div>
				{selectedLink !== undefined && (
					<div className="wp-block-blocks-course-team-member-link-form">
						<TextControl
							label={__('Icon', 'team-members')}
							value={sociallinks[selectedLink].icon}
							onChange={(icon) => {
								updateSocialLinks('icon', icon);
							}}
						/>
						<TextControl
							label={__('URL', 'team-members')}
							value={sociallinks[selectedLink].link}
							onChange={(link) => {
								updateSocialLinks('link', link);
							}}
						/>
						<br />
						<Button isDestructive onClick={onRemoveSocialLink}>
							{__('Remove Link', 'team-members')}
						</Button>
					</div>
				)}
			</div>
		</>
	);
}

export default withNotices(Edit);
