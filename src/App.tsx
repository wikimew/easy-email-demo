/* eslint-disable react/jsx-wrap-multilines */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, message, PageHeader } from "antd";
import mjml from "mjml-browser";

import {
  EmailEditor,
  EmailEditorProvider,
  IEmailTemplate,
  Stack,
} from "easy-email-editor";
import "easy-email-editor/lib/style.css";
import "antd/dist/antd.css";

import templateData from "./template.json";
import { useImportTemplate } from "./hooks/useImportTemplate";
import { useExportTemplate } from "./hooks/useExportTemplate";
import { copy } from "./urils/clipboard";
import {
  AdvancedType,
  BasicType,
  BlockManager,
  JsonToMjml,
} from "easy-email-core";
import {
  ExtensionProps,
  SimpleLayout,
  StandardLayout,
} from "easy-email-extensions";
import { FormApi } from "final-form";
import "easy-email-editor/lib/style.css";
import "easy-email-extensions/lib/style.css";
import "@arco-themes/react-easy-email-theme/css/arco.css";
import { IconMoonFill, IconSunFill } from "@arco-design/web-react/icon";
import { useWindowSize } from "react-use";

import "./CustomBlocks";

const fontList = [
  "Arial",
  "Tahoma",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Lato",
  "Montserrat",
].map((item) => ({ value: item, label: item }));

const categories: ExtensionProps["categories"] = [
  {
    label: "Content",
    active: true,
    blocks: [
      {
        type: AdvancedType.TEXT,
      },
      {
        type: AdvancedType.IMAGE,
        payload: { attributes: { padding: "0px 0px 0px 0px" } },
      },
      {
        type: AdvancedType.BUTTON,
      },
      {
        type: AdvancedType.SOCIAL,
      },
      {
        type: AdvancedType.DIVIDER,
      },
      {
        type: AdvancedType.SPACER,
      },
      {
        type: AdvancedType.HERO,
      },
      {
        type: AdvancedType.WRAPPER,
      },
    ],
  },
  {
    label: "Variables Fields",
    active: true,
    blocks: [
      {
        type: AdvancedType.TEXT,
        payload: {
          data: {
            value: {
              content: "{Name}",
            },
          },
        },
        title: "Name",
      },
      {
        type: AdvancedType.TEXT,
        payload: {
          data: {
            value: {
              content: "{credential.id}",
            },
          },
        },
        title: "Credential ID",
      },
    ],
  },
  {
    label: "Layout",
    active: true,
    displayType: "column",
    blocks: [
      {
        title: "2 columns",
        payload: [
          ["50%", "50%"],
          ["33%", "67%"],
          ["67%", "33%"],
          ["25%", "75%"],
          ["75%", "25%"],
        ],
      },
      {
        title: "3 columns",
        payload: [
          ["33.33%", "33.33%", "33.33%"],
          ["25%", "25%", "50%"],
          ["50%", "25%", "25%"],
        ],
      },
      {
        title: "4 columns",
        payload: [[["25%", "25%", "25%", "25%"]]],
      },
    ],
  },
];

const pageBlock = BlockManager.getBlockByType(BasicType.PAGE)!;

export default function Editor() {
  const [downloadFileName, setDownloadName] = useState("download.mjml");
  // const [template, setTemplate] = useState<IEmailTemplate['content']>(pageBlock.create({
  //   data: {
  //     value: {
  //       "content-background-color": '#ffffff'
  //     }
  //   }
  // }));
  const [template, setTemplate] =
    useState<IEmailTemplate["content"]>(templateData);
  const { importTemplate } = useImportTemplate();
  const { exportTemplate } = useExportTemplate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
    window.parent.addEventListener("message", handleMessage, false);

    function handleMessage(e) {
      var data = JSON.parse(e.data);
      setTemplate(data);
      alert(JSON.stringify(data));
    }
  }, [isDarkMode]);

  const { width } = useWindowSize();

  const smallScene = width < 1400;

  const onCopyHtml = (values: IEmailTemplate) => {
    const html = mjml(
      JsonToMjml({
        data: values.content,
        mode: "production",
        context: values.content,
      }),
      {
        beautify: true,
        validationLevel: "soft",
      }
    ).html;

    copy(html);
    message.success("Copied to pasteboard!");
  };

  const onImportMjml = async () => {
    try {
      const [filename, data] = await importTemplate();
      setDownloadName(filename);
      setTemplate(data);
    } catch (error) {
      message.error("Invalid mjml file");
    }
  };

  const onExportMjml = (values: IEmailTemplate) => {
    exportTemplate(
      downloadFileName,
      JsonToMjml({
        data: values.content,
        mode: "production",
        context: values.content,
      })
    );
  };

  const onSubmit = useCallback(
    async (
      values: IEmailTemplate,
      form: FormApi<IEmailTemplate, Partial<IEmailTemplate>>
    ) => {
      console.log("values", values);

      window.parent.postMessage(JSON.stringify(values), "*");
      message.success("Saved success!");
    },
    []
  );

  const initialValues: IEmailTemplate | null = useMemo(() => {
    return {
      subject: "Welcome to Easy-email",
      subTitle: "Nice to meet you!",
      content: template,
    };
  }, [template]);

  if (!initialValues) return null;

  return (
    <div>
      <EmailEditorProvider
        dashed={false}
        data={initialValues}
        height={"calc(100vh - 85px)"}
        // onUploadImage={services.common.uploadByQiniu}

        autoComplete
        fontList={fontList}
        onSubmit={onSubmit}
      >
        {({ values }, { submit }) => {
          return (
            <>
              <PageHeader
                title="Edit"
                style={{ background: "var(--color-bg-2)" }}
                extra={
                  <Stack alignment="center">
                    <Button
                      onClick={() => setIsDarkMode((v) => !v)}
                      shape="circle"
                      type="text"
                      icon={isDarkMode ? <IconMoonFill /> : <IconSunFill />}
                    ></Button>
                    <Button onClick={() => onCopyHtml(values)}>
                      Copy Html
                    </Button>
                    <Button onClick={() => onExportMjml(values)}>
                      Export Template
                    </Button>
                    <Button onClick={onImportMjml}>import Template</Button>
                    <Button type="primary" onClick={() => submit()}>
                      Save
                    </Button>
                  </Stack>
                }
              />

              <StandardLayout
                compact={!smallScene}
                categories={categories}
                showSourceCode={true}
              >
                <EmailEditor />
              </StandardLayout>
            </>
          );
        }}
      </EmailEditorProvider>
    </div>
  );
}
