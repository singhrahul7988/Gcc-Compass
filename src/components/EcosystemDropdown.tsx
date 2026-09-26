import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './ecosystemDropdown.css';

export type EcosystemDropdownOption = { value: string; label: string };
type Props = {
  label: string;
  defaultLabel: string;
  value: string;
  options: EcosystemDropdownOption[];
  onChange: (value: string) => void;
  Icon?: LucideIcon;
};
type Placement = { left: number; top: number; width: number; maxHeight: number; above: boolean };

export function EcosystemDropdown({ label, defaultLabel, value, options, onChange, Icon }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const items = [{ value: '', label: defaultLabel }, ...options];
  const selected = Math.max(0, items.findIndex(item => item.value === value));

  const show = (index = selected) => {
    typeahead.current = { text: '', time: 0 };
    setActive(index);
    setOpen(true);
  };
  const choose = (index: number) => {
    onChange(items[index].value);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    const reposition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12, gap = 8;
      const below = window.innerHeight - rect.bottom - gap - margin;
      const above = rect.top - gap - margin;
      const preferredHeight = Math.min(320, items.length * 48 + 12);
      const placeAbove = below < Math.min(preferredHeight, 200) && above > below;
      const width = Math.min(Math.max(rect.width, 240), window.innerWidth - margin * 2);
      setPlacement({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        top: placeAbove ? rect.top - gap : rect.bottom + gap,
        width,
        maxHeight: Math.max(0, Math.min(320, placeAbove ? above : below)),
        above: placeAbove,
      });
    };
    reposition();
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      reposition();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, items.length]);

  useLayoutEffect(() => {
    if (open && placement) menuRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active, placement]);

  useEffect(() => {
    if (!open) { typeahead.current = { text: '', time: 0 }; return; }
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key;
    if (key === 'Tab') { setOpen(false); return; }
    if (key === 'Escape') {
      if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show();
      else setActive(index => Math.max(0, Math.min(items.length - 1, index + (key === 'ArrowDown' ? 1 : -1))));
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const index = key === 'Home' ? 0 : items.length - 1;
      if (!open) show(index); else setActive(index);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) choose(active); else show();
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      const now = Date.now();
      const previous = now - typeahead.current.time < 700 ? typeahead.current.text : '';
      const text = previous + key.toLocaleLowerCase();
      typeahead.current = { text, time: now };
      const repeated = [...text].every(character => character === text[0]);
      const query = repeated ? key.toLocaleLowerCase() : text;
      const start = open ? active : selected;
      const match = Array.from({ length: items.length }, (_, offset) => (start + (repeated ? 1 : 0) + offset) % items.length)
        .find(index => items[index].label.toLocaleLowerCase().startsWith(query));
      if (match !== undefined) { setActive(match); setOpen(true); }
    }
  };

  const trigger = <button
    ref={triggerRef}
    type="button"
    className={`ecosystem-dropdown-trigger ${Icon ? 'ecosystem-filter' : ''}`}
    role="combobox"
    aria-label={label}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? `${id}-menu` : undefined}
    aria-activedescendant={open && placement ? `${id}-option-${active}` : undefined}
    onClick={() => open ? setOpen(false) : show()}
    onKeyDown={onKeyDown}
    onBlur={event => { if (!menuRef.current?.contains(event.relatedTarget)) setOpen(false); }}
  >
    {Icon && <Icon className="ecosystem-dropdown-icon" size={24} strokeWidth={1.8} aria-hidden="true" />}
    <span className="ecosystem-dropdown-text">
      {Icon && <span className="ecosystem-filter-label">{label}</span>}
      <span className="ecosystem-dropdown-value" title={items[selected].label}>{items[selected].label}</span>
    </span>
    <ChevronDown className="ecosystem-dropdown-chevron" size={14} aria-hidden="true" />
  </button>;

  return <>
    {Icon ? trigger : <div className="opportunity-filter ecosystem-dropdown-compact"><span aria-hidden="true">{label}</span>{trigger}</div>}
    {open && placement && createPortal(<ul
      ref={menuRef}
      id={`${id}-menu`}
      className="ecosystem-dropdown-menu"
      role="listbox"
      aria-label={label}
      style={{ left: placement.left, top: placement.top, width: placement.width, maxHeight: placement.maxHeight, transform: placement.above ? 'translateY(-100%)' : undefined }}
      onMouseDown={event => event.preventDefault()}
    >
      {items.map((item, index) => <li
        key={item.value}
        id={`${id}-option-${index}`}
        role="option"
        aria-selected={item.value === value}
        data-value={item.value}
        className={`ecosystem-dropdown-option ${index === active ? 'is-active' : ''}`}
        onPointerMove={event => { if (event.pointerType === 'mouse') setActive(index); }}
        onClick={() => choose(index)}
      ><span>{item.label}</span><Check size={17} aria-hidden="true" /></li>)}
    </ul>, document.body)}
  </>;
}
