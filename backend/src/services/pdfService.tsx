import React from "react";
import type { QuestionPaper } from "../types/assignment";

type ReactPdfModule = typeof import("@react-pdf/renderer");

const importReactPdfRenderer = () =>
  new Function("specifier", "return import(specifier)")(
    "@react-pdf/renderer"
  ) as Promise<ReactPdfModule>;

export const generateQuestionPaperPdf = async ({
  assignmentTitle,
  paper
}: {
  assignmentTitle: string;
  paper: QuestionPaper;
}) => {
  const { Document, Page, StyleSheet, Text, View, renderToBuffer } =
    await importReactPdfRenderer();

  const styles = StyleSheet.create({
    page: {
      paddingTop: 32,
      paddingBottom: 32,
      paddingHorizontal: 36,
      fontSize: 11,
      color: "#111827",
      lineHeight: 1.5
    },
    header: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#d1d5db",
      paddingBottom: 12
    },
    schoolName: {
      fontSize: 17,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 8
    },
    assignmentTitle: {
      fontSize: 12,
      textAlign: "center",
      marginBottom: 10
    },
    metadataRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8
    },
    studentBox: {
      borderWidth: 1,
      borderColor: "#d1d5db",
      borderRadius: 6,
      padding: 10,
      marginBottom: 16
    },
    section: {
      marginBottom: 18
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 4
    },
    instruction: {
      color: "#4b5563",
      marginBottom: 8
    },
    questionBlock: {
      marginBottom: 10
    },
    questionMeta: {
      color: "#6b7280",
      fontSize: 10,
      marginTop: 3
    },
    options: {
      marginTop: 4,
      marginLeft: 12
    },
    option: {
      marginBottom: 2
    },
    answerTitle: {
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 12
    },
    answerRow: {
      marginBottom: 8
    }
  });

  const QuestionPaperPdfDocument = () => (
    <Document title={`${paper.subject} Question Paper`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{paper.schoolName}</Text>
          <Text style={styles.assignmentTitle}>{assignmentTitle}</Text>
          <View style={styles.metadataRow}>
            <Text>Subject: {paper.subject}</Text>
            <Text>Class: {paper.class}</Text>
            <Text>Max Marks: {paper.maxMarks}</Text>
            <Text>Duration: {paper.duration}</Text>
          </View>
        </View>

        <View style={styles.studentBox}>
          <Text>
            Name: ____________________   Roll No: ____________________   Section:
            ____________________
          </Text>
        </View>

        {paper.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.instruction}>{section.instruction}</Text>

            {section.questions.map((question, index) => (
              <View key={question.id} style={styles.questionBlock}>
                <Text>
                  Q{index + 1}. {question.text}
                </Text>
                <Text style={styles.questionMeta}>
                  Difficulty: {question.difficulty} | Marks: {question.marks}
                </Text>
                {question.options?.length ? (
                  <View style={styles.options}>
                    {question.options.map((option) => (
                      <Text key={`${question.id}-${option}`} style={styles.option}>
                        - {option}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.answerTitle}>Answer Key</Text>
        {paper.answerKey.map((answer) => (
          <View key={answer.questionId} style={styles.answerRow}>
            <Text>
              {answer.questionId}: {answer.answer}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  return renderToBuffer(<QuestionPaperPdfDocument />);
};
