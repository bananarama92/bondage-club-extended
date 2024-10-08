interface BCXVersion {
	major: number;
	minor: number;
	patch: number;
	extra?: string;
	dev?: boolean;
}

//#region Rules
interface BCX_RuleStateAPI_Generic {
	/** The name of the rule */
	readonly rule: string;
	/** Definition of the rule */
	readonly ruleDefinition: any;

	/** Current condition data of the rule */
	readonly condition: any;

	/** If the rule is in effect (active and all conditions valid) */
	readonly inEffect: boolean;
	/** If the rule is enforced (inEffect and enforce enabled) */
	readonly isEnforced: boolean;
	/** If the rule is logged (inEffect and logging enabled) */
	readonly isLogged: boolean;

	/** Rule setttings */
	readonly customData: any;
	/** Rule internal data */
	readonly internalData: any;

	/**
	 * Triggers and logs that Player violated this rule
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	trigger(targetCharacter?: number | null, dictionary?: Record<string, string>): void;

	/**
	 * Triggers and logs that Player attempted to violate this rule, but the attempt was blocked (for enforced rules)
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	triggerAttempt(targetCharacter?: number | null, dictionary?: Record<string, string>): void;
}

// If using full BCX declarations (remove if not)
interface BCX_RuleStateAPI<ID extends BCX_Rule> extends BCX_RuleStateAPI_Generic {
	readonly rule: ID;
	readonly ruleDefinition: RuleDisplayDefinition<ID>;

	readonly condition: ConditionsConditionData<"rules"> | undefined;

	readonly customData: ID extends keyof RuleCustomData ? (RuleCustomData[ID] | undefined) : undefined;
	readonly internalData: ID extends keyof RuleInternalData ? (RuleInternalData[ID] | undefined) : undefined;
}

// If not using full BCX declarations (uncomment if not)
// type BCX_Rule = string;
// type BCX_RuleStateAPI<ID extends BCX_Rule> = BCX_RuleStateAPI_Generic;

//#endregion

interface BCX_Events {
	curseTrigger: {
		/** Which action the curses did to the item */
		action: "remove" | "add" | "swap" | "update" | "color" | "autoremove";
		/** Name of asset group that was changed */
		group: string;
	};
	/**
	 * Triggers whenever a rule triggers (either by BCX or by external API)
	 * @note If you need extra data about rule's configuration, use `BCX_ModAPI.getRuleState`
	 */
	ruleTrigger: {
		/** The rule that was triggered */
		rule: BCX_Rule;
		/**
		 * Type of trigger that happened:
		 * - `trigger` - The action this rule dected did happen (e.g. because the rule was not enforced)
		 * - `triggerAttempt` - The action was caught by the rule and did not happen
		 */
		triggerType: "trigger" | "triggerAttempt";
		/**
		 * Character that was being targetted (e.g. for whisper/beep rules, possibly few others).
		 * Most rules do not use this.
		 */
		targetCharacter: number | null;
	};
	/**
	 * Triggers whenever player changes subscreen in BCX.
	 * Note, that some changes might not be observable by outside mod (e.g. when user simply switches to different subscreen).
	 * This can trigger even outside of `InformationSheet` screen.
	 */
	bcxSubscreenChange: {
		/**
		 * Whether BCX is currently showing one of custom screens, overriding the default BC screen.
		 *
		 * At the time of emitting, this value is the same as the one returned by `bcx.inBcxSubscreen()`.
		 */
		inBcxSubscreen: boolean;
	};
	/**
	 * Triggers whenever BCX sends a "local" message to the chat.
	 */
	bcxLocalMessage: {
		/** The actual message that is to be displayed */
		message: string | Node;
		/** Timeout of the message - if set, the message auto-hides after {timeout} milliseconds */
		timeout?: number;
		/** Sender metadata (used for displaying a membernumber on some messages) */
		sender?: number;
	};
}

interface BCX_ModAPI extends BCXEventEmitter<BCX_Events> {
	/** Name of the mod this API was requested for */
	readonly modName: string;

	/** Returns state handler for a rule or `null` for unknown rule */
	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null;
}

interface BCX_ConsoleInterface {
	/** Version of loaded BCX */
	readonly version: string;

	/** Version parsed to components */
	readonly versionParsed: Readonly<BCXVersion>;

	/**
	 * Gets BCX version of another character in room
	 * @param target - The membernumber of character to get; undefined = Player
	 */
	getCharacterVersion(target?: number): string | null;

	/** Gets if BCX runs in development mode */
	readonly isDevel: boolean;

	/**
	 * Get access to BCX Mod API.
	 * @param mod - Same identifier of your mod as used for ModSDK
	 */
	getModApi(mod: string): BCX_ModAPI;

	/** Whether BCX is currently showing one of custom screens, overriding the default BC screen. */
	inBcxSubscreen(): boolean;
}

interface Window {
	bcx?: BCX_ConsoleInterface;
}

type BCXEvent = Record<never, unknown>;
type BCXAnyEvent<T extends BCXEvent> = {
	[key in keyof T]: {
		event: key;
		data: T[key];
	};
}[keyof T];

interface BCXEventEmitter<T extends BCXEvent> {
	on<K extends keyof T>(s: K, listener: (v: T[K]) => void): () => void;
	onAny(listener: (value: BCXAnyEvent<T>) => void): () => void;
}
