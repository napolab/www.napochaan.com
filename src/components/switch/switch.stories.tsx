import { action } from "@storybook/addon-actions";
import React, { useCallback } from "react";

import Switch from "@components/switch";

import type { SwitchProps } from "@components/switch";
import type { Meta as ComponentMeta, Story as ComponentStory } from "@storybook/react";

const meta: ComponentMeta<SwitchProps> = {
  title: "components/Switch",
  component: Switch,
  argTypes: {
    label: {
      type: "string",
    },
  },
};
export default meta;

export const Default: ComponentStory<SwitchProps> = (props) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <Switch {...props} onChange={action("change")} onBlur={action("blur")} onFocus={action("focus")} />
      <Switch
        {...props}
        onChange={action("change")}
        onBlur={action("blur")}
        onFocus={action("focus")}
        label="with label"
      />
      <Switch
        {...props}
        disabled
        onChange={action("change")}
        onBlur={action("blur")}
        onFocus={action("focus")}
        label="disabled"
      />
      <Switch
        {...props}
        readonly
        onChange={action("change")}
        onBlur={action("blur")}
        onFocus={action("focus")}
        label="readonly"
      />
    </div>
  );
};
Default.args = {
  "aria-label": "switch",
  size: "medium",
  labelPosition: "right",
};

export const WithLabel: ComponentStory<SwitchProps> = (props) => {
  return <Switch {...props} onChange={action("change")} onBlur={action("blur")} onFocus={action("focus")} />;
};
WithLabel.args = {
  "aria-label": "switch",
  label: <p>with label</p>,
};

export const UseForm: ComponentStory<SwitchProps> = (props) => {
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    action("submit")(e);
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <Switch {...props} />

      <div>
        <button type="submit">submit</button>
      </div>
    </form>
  );
};

UseForm.args = {
  "aria-label": "switch",
  name: "switch",
  value: "on",
};
