/* eslint-disable consistent-return */
import { h } from 'vue';
import SwipeOut from './SwipeOut';

export default {
	name: 'SwipeList',
	props: {
		items: {
			type: Array,
			required: true,
		},
		itemKey: {
			type: String,
		},
		/**
		 * @deprecated since version 2.0 - use itemKey instead
		 */
		transitionKey: {
			type: String,
		},
		threshold: {
			type: Number,
			default: 45,
		},
		revealed: {
			type: Object,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		itemDisabled: {
			type: Function,
			default: () => false,
		},
		passiveListeners: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['revealed', 'closed', 'update:revealed', 'swipeout:click', 'left-revealed', 'right-revealed', 'active'],
	data() {
		return {
			innerRevealed: this.revealed || {},
			rev: this.items.map(() => null),
		};
	},
	watch: {
		revealed(val) {
			this.innerRevealed = val;
		},
		items() {
			this._emitRevealed({});
		},
	},
	methods: {
		revealRight(index) {
			if (!this.$refs.items[index])
				return;
			this.$refs.items[index].revealRight();
		},
		revealLeft(index) {
			if (!this.$refs.items[index])
				return;
			this.$refs.items[index].revealLeft();
		},
		close(index) {
			if (!this.$refs.items)
				return;

			if (index === undefined)
				return this.$refs.items.forEach(i => i.close());

			if (!this.$refs.items[index])
				return;

			return this.$refs.items[index].close();
		},
		isRevealed(index) {
			return this.innerRevealed[index] || false;
		},
		/**
		 * @deprecated use ```close``` instead
		 */
		closeActions(index) {
			this.close(index);
		},
		// private
		/*
		_updateRevealed(item, index, side) {
			const key = this._getItemKey(item, index);
			if (side)
				return this.$set(this.innerRevealed, key, side);
			return this.$delete(this.innerRevealed, key);
		},
		*/
		_onReveal(item, index, event) {
			this.$emit('revealed', {
				index,
				item,
				side: event.side,
				close: event.close,
			});
			this._emitRevealed({
				...this.innerRevealed,
				[index]: event.side,
			});
		},
		_onClose(item, index) {
			this.$emit('closed', {
				index,
				item,
			});
			const { [index]: omit, ...newRevealed } = this.innerRevealed;
			this._emitRevealed(newRevealed);
		},
		_getItemKey(item, index) {
			const keyPropery = this.itemKey || this.transitionKey;
			if (keyPropery !== undefined)
				return item[this.itemKey || this.transitionKey];
			return index;
		},
		_emitRevealed(val) {
			if (this.revealed !== undefined) {
				this.$emit('update:revealed', val);
				return;
			}
			this.innerRevealed = val;
		},
		__renderItem(item, index) {
			const { left, right, default: defaultScope } = this.$slots;
			const slots = {};

			if (left)
				slots.left = ({ close }) => left({ item, close, index });

			if (right)
				slots.right = ({ close }) => right({ item, close, index });

			slots.default = ({
				close,
				disabled,
				revealLeft,
				revealRight,
				revealed,
			}) => h('div', {
				ref: 'itemsContent',
				onClick: () => { this.$emit('swipeout:click', item); },
			}, defaultScope({
				item,
				index,
				close,
				disabled,
				revealed,
				revealLeft,
				revealRight,
			}));

			return h(SwipeOut, {
				key: index,
				ref: 'items',
				ref_for: true,
				class: ['swipeout-list-item'],
				disabled: this.disabled || this.itemDisabled(item),
				threshold: this.threshold,
				revealed: this.innerRevealed[index],
				passiveListeners: this.passiveListeners,
				onRevealed: ($event) => { this._onReveal(item, index, $event); },
				onLeftRevealed: ($event) => { this.$emit('left-revealed', { index, item, close: $event.close }); },
				onRightRevealed: ($event) => { this.$emit('right-revealed', { index, item, close: $event.close }); },
				onClosed: ($event) => { this._onClose(item, index, $event); },
				onActive: ($event) => { this.$emit('active', $event); },
			},
			slots);
		},
	},
	render() {
		return h('div', {
			class: ['swipeout-list', { 'swipeout--disabled': this.disabled }],
		}, this.items.map((item, index) => this.__renderItem(item, index)));
	},
};
