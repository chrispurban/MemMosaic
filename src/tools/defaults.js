export const __x = true;
export const __o = false;

export const defaultNodes = [
	{
		id:"N 0",
		text: "Origin",
		icon: "🧿",
		links: [
			"L 1",
			"L 2",
			"L 3",
			"L 4",
			"L 9"
		],
		color: "hsl(0,0%,90%)",
	},
	{
		id:"N 1",
		text: "Welcome! This is a draggable note; click inside to edit it",
		icon: null,
		links: [
			"L 1",
		],
		color: "hsl(0,0%,90%)",
	},
	{
		id:"N 2",
		text: "Save and dismiss an edit by clicking outside or by pressing ENTER, or cancel it with ESC",
		icon: null,
		links: [
			"L 2",
		],
		color: "hsl(0,0%,90%)",
	},
	{
		id:"N 9",
		text: `Double-click an empty area to create a note, or remove it with DELETE while dragging`,
		icon: null,
		links: [
			"L 9",
		],
		color: "hsl(0,0%,90%)",
	},
	{
		id:"N 3",
		text: `"Origin" is the name of which topic you're currently viewing; click "More Info" to swap over`,
		icon: null,
		links: [
			"L 3",
		],
		color: "hsl(0,0%,90%)",
	},
	{
		id:"N 4",
		text: `More Info`,
		icon: `✨`,
		links: [
			"L 4",
			"L 5",
			"L 6",
			"L 7",
			"L 8",
		],
		color: "hsl(20,40%,90%)",
	},
	{
		id:"N 5",
		text: `You've clicked a link! When dragged, these maintain their position between topics`,
		icon: null,
		links: [
			"L 5"
		],
		color: "hsl(20,40%,90%)",
	},
	{
		id:"N 6",
		text: `The bottom bar can copy any link dragged in (until refresh) or out again (permanent)`,
		icon: null,
		links: [
			"L 6"
		],
		color: "hsl(20,40%,90%)",
	},
	{
		id:"N 7",
		text: `Holding CTRL while clicking will create a topic instead of a note, or edit its link instead of visit`,
		icon: null,
		links: [
			"L 7"
		],
		color: "hsl(20,40%,90%)",
	},
	{
		id:"N 8",
		text: `Clicking the top-left button will send you to the Origin topic while storing a return link`,
		icon: null,
		links: [
			"L 8"
		],
		color: "hsl(20,40%,90%)",
	},
]
  
  
export const defaultLinks = [
	{
		id:"L 0",
		nodes:[
			"N 0"
		],
		position:{
			x: -6/12,
			y: -6/12,
		},
		length:{
			x:3,
			y:3,
		},
		canTravel:true,
	},
	{
		id:"L 1",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 0",
			"N 1",
		],
		position:{
			x: 0,
			y: -19/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 2",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 0",
			"N 2",
		],
		position:{
			x: 0,
			y: -9/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 3",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 0",
			"N 3",
		],
		position:{
			x: 0,
			y: 11/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 4",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 0",
			"N 4",
		],
		position:{
			x: 0,
			y: 21/12,
		},
		length:{
			x: 3,
			y: 1,
		},
		canTravel:true,
	},
	{
		id:"L 5",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 4",
			"N 5",
		],
		position:{
			x: -13/12,
			y: -9/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 6",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 4",
			"N 6",
		],
		position:{
			x: 13/12,
			y: -9/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 7",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 4",
			"N 7",
		],
		position:{
			x: -13/12,
			y: 1/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 8",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 4",
			"N 8",
		],
		position:{
			x: 13/12,
			y: 1/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
	{
		id:"L 9",
		nodes:[
			// need neo4j before considering non-canvas nodes which exist in only one location across several others
			"N 0",
			"N 9",
		],
		position:{
			x: 0,
			y: 1/12,
		},
		length:{
			x: 6,
			y: 2,
		},
		canTravel:false,
	},
]
  