"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "../../lib/api/types";
import { translate } from "../../lib/i18n";
import { ApiClient } from "../../lib/api/api-client";
import { cx, FOCUS_RING } from "../../components/primitives/utils";

export interface SearchExperienceProps {
  readonly locale: Locale;
  readonly initialQuery?: string;
  readonly action?: string;
}

export function SearchExperience({
  locale,
  initialQuery = "",
  action = "/search",
}: SearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listboxId = "search-suggestions-listbox";
  const getItemId = (index: number) => `search-suggestion-${index}`;

  const fetchSuggestions = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      try {
        const client = new ApiClient();
        const result = await client.getSearchSuggestions(term);
        if (result.status === "success") {
          setSuggestions(result.data);
          setIsOpen(result.data.length > 0);
          setActiveIndex(-1);
          if (result.data.length > 0) {
            setAnnouncement(
              translate(locale, "search.suggestions.count").replace(
                "{0}",
                String(result.data.length),
              ),
            );
          } else {
            setAnnouncement("");
          }
        }
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case "Enter": {
        const selected =
          activeIndex >= 0 ? suggestions[activeIndex] : undefined;
        if (selected !== undefined) {
          event.preventDefault();
          setQuery(selected);
          setIsOpen(false);
          setActiveIndex(-1);
        }
        break;
      }
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleBlur() {
    setTimeout(() => setIsOpen(false), 150);
  }

  const inputClassName = cx(
    "w-full rounded-lg border border-stroke-heavy bg-surface-white-bg px-3 py-2 text-body text-text-primary",
    FOCUS_RING,
  );

  return (
    <div className="relative">
      <form action={action} method="get" role="search">
        <label htmlFor="search-input" className="sr-only">
          {translate(locale, "search.placeholder")}
        </label>
        <input
          ref={inputRef}
          id="search-input"
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={translate(locale, "search.placeholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? getItemId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          aria-label={translate(locale, "search.placeholder")}
          className={inputClassName}
        />
      </form>
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={translate(locale, "search.suggestions.ariaLabel")}
          className="absolute z-50 mt-1 w-full rounded-lg border border-stroke-heavy bg-surface-white-bg shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              id={getItemId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(suggestion);
                setIsOpen(false);
              }}
              className={cx(
                "cursor-pointer px-3 py-2 text-body text-text-primary",
                index === activeIndex && "bg-surface-background",
              )}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
