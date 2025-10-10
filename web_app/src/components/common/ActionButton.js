import React from 'react';

const icons = {
	view: (
		<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
		</svg>
	),
	edit: (
		<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
		</svg>
	),
	delete: (
		<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	),
};

const ActionButton = ({ type, onClick, title, disabled }) => {
	return (
		<button
			onClick={onClick}
			title={title}
			disabled={disabled}
			className={`mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors ${
				type === 'view' ? 'text-green-600' : type === 'edit' ? 'text-blue-600' : 'text-red-600'
			}`}
		>
			{icons[type]}
		</button>
	);
};

// Component hiển thị 3 nút: xem, sửa, xoá
export const ActionButtonsGroup = ({ onView, onEdit, onDelete, disabled }) => (
	<div className="flex items-center">
		<ActionButton type="view" onClick={onView} title="Xem" disabled={disabled} />
		<ActionButton type="edit" onClick={onEdit} title="Sửa" disabled={disabled} />
		<ActionButton type="delete" onClick={onDelete} title="Xoá" disabled={disabled} />
	</div>
);

export default ActionButton;
