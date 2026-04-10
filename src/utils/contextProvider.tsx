import React, { useReducer, useContext } from 'react';
import { StateKeys, ContextProps, ProviderProps } from './types';

const initialState: StateKeys = {
	rotationDegree: 0,
	flipDirection: 1,
	pressedKey: '',
	wheelDirection: '',
	wheelActive: false,
	scaleVector: 1,
	svgTransform: {},
	pickedHair: 'HatHip',
	pickedBody: 'PointingUp',
	pickedFace: 'Smile',
	pickedFacialHair: 'None',
	pickedAccessory: 'None',
	pickedSection: 'Accessories',
	strokeColor: '#000000',
	backgroundBasicColor: '#FFD55A',
	backgroundFirstGradientColor: '#81087F',
	backgroundSecondGradientColor: '#ffd402',
	firstColor: '#81087F',
	secondColor: '#ffd402',
	isFrameTransparent: false,
	isCharacterCreated: false,
	tasks: [],
};

export const Context = React.createContext<ContextProps>({
	state: initialState,
	dispatch: () => { },
});

const reducer = (state: StateKeys, action: any) => {
	switch (action.type) {
		case 'SET_CHARACTER_CREATED':
			return { ...state, isCharacterCreated: action.payload };
		case 'ADD_TASK':
			return { ...state, tasks: [...state.tasks, action.payload] };
		case 'REMOVE_TASK':
			return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
		case 'TOGGLE_TASK':
			return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) };
		case 'SET_ROTATION_DEGREE':
			return { ...state, rotationDegree: action.payload };
		case 'SET_FLIP_DIRECTION':
			return { ...state, flipDirection: action.payload };
		case 'SET_PRESSED_KEY':
			return { ...state, pressedKey: action.payload };
		case 'SET_WHEEL_DIRECTION':
			return { ...state, wheelDirection: action.payload };
		case 'SET_IS_WHEEL_ACTIVE':
			return { ...state, wheelActive: action.payload };
		case 'SET_SVG_TRANSFORM':
			return { ...state, svgTransform: action.payload };
		case 'SET_SCALE_VECTOR':
			return { ...state, scaleVector: action.payload };
		case 'SET_HAIR':
			return { ...state, pickedHair: action.payload };
		case 'SET_BODY':
			return { ...state, pickedBody: action.payload };
		case 'SET_FACE':
			return { ...state, pickedFace: action.payload };
		case 'SET_FACIAL_HAIR':
			return { ...state, pickedFacialHair: action.payload };
		case 'SET_ACCESSORY':
			return { ...state, pickedAccessory: action.payload };
		case 'SET_PIECE_SECTION':
			return { ...state, pickedSection: action.payload };
		case 'SET_STROKE_COLOR':
			return { ...state, strokeColor: action.payload };
		case 'SET_BACKGROUND_BASIC_COLOR':
			return { ...state, backgroundBasicColor: action.payload };
		case 'SET_FRAME_TYPE':
			return { ...state, isFrameTransparent: action.payload };
		default:
			return state;
	}
};

export const Provider: React.FC<ProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, initialState);
	return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>;
};

export const useProvider = () => useContext(Context);