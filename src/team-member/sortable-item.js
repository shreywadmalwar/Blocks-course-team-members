import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';

export default function SortableItems(props) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: props.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	return (
		<li ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<button
				aria-label={__('Edit social Link', 'team-members')}
				onClick={() => props.setSelectedLink(props.index)}
				className={
					props.selectedLink == props.index ? 'is-selected' : null
				}
			>
				<Icon icon={props.icon} />
			</button>
		</li>
	);
}
