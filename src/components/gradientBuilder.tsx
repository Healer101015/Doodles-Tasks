import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProvider } from '../utils/contextProvider';
import { EditableInput } from 'react-color/lib/components/common';
// @ts-ignore
import CircularSlider from './circularSlider';
import { ColorResult } from 'react-color';
//@ts-ignore
import { isValidHex } from 'react-color/lib/helpers/color';
import { GradientType } from 'react-peeps/lib/peeps/types';
import { ColorWheel } from './colorWheel';

export const GradientBuilder: React.FC<{
	type?: 'Background' | 'Foreground';
}> = ({ type }) => {
	const { state, dispatch } = useProvider();
	const {
		strokeColor,
		firstColor: foregroundFirstGradientColor,
		secondColor: foregroundSecondGradientColor,
		backgroundBasicColor,
		backgroundFirstGradientColor,
		backgroundSecondGradientColor,
		isFrameTransparent,
	} = state;

	const firstColor = useMemo(() => {
		if (type === 'Background') {
			return backgroundFirstGradientColor;
		} else {
			return foregroundFirstGradientColor;
		}
	}, [foregroundFirstGradientColor, backgroundFirstGradientColor]);

	const secondColor = useMemo(() => {
		if (type === 'Background') {
			return backgroundSecondGradientColor;
		} else {
			return foregroundSecondGradientColor;
		}
	}, [foregroundSecondGradientColor, backgroundSecondGradientColor]);

	const [gradientDegree, setGradientDegree] = useState(
		(type === 'Background'
			? (backgroundBasicColor as GradientType).degree
			: (strokeColor as GradientType).degree) || 0
	);

	const [activeColorPicker, setActiveColorPicker] = useState<'first' | 'second' | null>(null);

	useEffect(() => {
		const dispatchKey =
			type === 'Background' ? 'SET_BACKGROUND_BASIC_COLOR' : 'SET_STROKE_COLOR';
		dispatch({
			type: dispatchKey,
			payload: {
				degree: gradientDegree,
				firstColor,
				secondColor,
			},
		});
	}, [firstColor, secondColor, gradientDegree, dispatch]);

	const handleColorChange = useCallback((caller: 'first' | 'second') => {
		return (color: ColorResult) => {
			if (!isValidHex(color)) {
				return;
			}
			if (type === 'Background') {
				const requestType =
					caller === 'first'
						? 'SET_BACKGROUND_FIRST_GRADIENT_COLOR'
						: 'SET_BACKGROUND_SECOND_GRADIENT_COLOR';
				dispatch({
					type: requestType,
					payload: color,
				});
			} else {
				const requestType =
					caller === 'first'
						? 'SET_FOREGROUND_FIRST_COLOR'
						: 'SET_FOREGROUND_SECOND_COLOR';
				dispatch({
					type: requestType,
					payload: color,
				});
			}
		};
	}, [type, dispatch]);

	const handleMouseWheel = useCallback(({ nativeEvent }: React.WheelEvent) => {
		if (nativeEvent?.deltaY < 0) {
			setGradientDegree((degree) => (degree + 10 > 360 ? 10 : degree + 10));
		} else {
			setGradientDegree((degree) => (degree - 10 < 0 ? 350 : degree - 10));
		}
	}, []);

	const handleFirstColorBoxClick = useCallback(() => {
		setActiveColorPicker(prev => prev === 'first' ? null : 'first');
	}, []);

	const handleSecondColorBoxClick = useCallback(() => {
		setActiveColorPicker(prev => prev === 'second' ? null : 'second');
	}, []);

	const showingPicker = activeColorPicker !== null;

	const gradientBackground = `linear-gradient(${gradientDegree}deg, ${firstColor}, ${secondColor})`;

	return (
		<div className='gradientBlock'>
			{/* Gradient preview with circular slider - only visible when no picker is open */}
			<div
				className='gradientPreview'
				style={{
					background: showingPicker ? 'transparent' : gradientBackground,
					position: 'relative',
					overflow: 'hidden',
				}}
				onWheel={handleMouseWheel}
			>
				{!showingPicker && (
					//@ts-ignore
					<CircularSlider
						width={110}
						min={0}
						max={360}
						direction={-1}
						knobPosition='right'
						progressColorFrom='#FFFFFF'
						progressColorTo='#FFFFFF'
						knobColor='#FFFFFF'
						trackColor='#FFFFFF'
						appendToValue='°'
						valueFontSize='15px'
						trackSize={4}
						progressSize={4}
						onChange={(value: number) => {
							setGradientDegree(value);
						}}
						label=''
						dataIndex={gradientDegree}
					/>
				)}

				{/* Color wheel pickers rendered INSIDE the preview area */}
				{activeColorPicker === 'first' && (
					<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
						<ColorWheel
							type={type}
							color={firstColor}
							target='first'
						/>
					</div>
				)}
				{activeColorPicker === 'second' && (
					<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
						<ColorWheel
							type={type}
							color={secondColor}
							target='second'
						/>
					</div>
				)}
			</div>

			{/* Color boxes row */}
			<div className='gradientColorBoxWrapper'>
				<div
					title={firstColor as string}
					className='gradientColorBox'
					style={{
						background: firstColor as string,
						animation: activeColorPicker === 'first' ? 'pulse 1s infinite' : 'unset',
						cursor: 'pointer',
					}}
					onClick={handleFirstColorBoxClick}
				/>
				<div
					title={secondColor as string}
					className='gradientColorBox'
					style={{
						background: secondColor as string,
						animation: activeColorPicker === 'second' ? 'pulse 1s infinite' : 'unset',
						cursor: 'pointer',
					}}
					onClick={handleSecondColorBoxClick}
				/>
			</div>

			{/* Hex inputs */}
			<div className='gradientInputWrapper'>
				<EditableInput
					value={firstColor}
					onChange={handleColorChange('first')}
					style={{
						input: {
							width: '90%',
							fontSize: '12px',
							color: '#666',
							border: '0px',
							outline: 'none',
							height: '22px',
							boxShadow: 'inset 0 0 0 1px #ddd',
							borderRadius: '4px',
							padding: '0 7px',
							boxSizing: 'border-box',
						},
					}}
				/>
				<EditableInput
					value={secondColor}
					onChange={handleColorChange('second')}
					style={{
						input: {
							width: '90%',
							fontSize: '12px',
							color: '#666',
							border: '0px',
							outline: 'none',
							height: '22px',
							boxShadow: 'inset 0 0 0 1px #ddd',
							borderRadius: '4px',
							padding: '0 7px',
							boxSizing: 'border-box',
						},
					}}
				/>
			</div>
		</div>
	);
};