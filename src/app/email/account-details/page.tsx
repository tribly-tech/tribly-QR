"use client";

import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

const PLACEHOLDER_USER_ID = "{{userId}}";
const PLACEHOLDER_PASSWORD = "{{temporaryPassword}}";

export default function AccountDetailsEmailTemplatePage() {
  const [copiedField, setCopiedField] = useState<"userId" | "password" | null>(
    null
  );

  const copyToClipboard = useCallback(
    async (text: string, field: "userId" | "password") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        // ignore
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4 flex items-center justify-center">
      {/* Outer preview background */}
      <div className="w-full max-w-xl">
        {/* Email wrapper – designed to be copied as the actual email HTML */}
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            borderCollapse: "collapse",
            fontFamily:
              '"Clash Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <tbody>
            {/* Slot 1 – Image / brand header */}
            <tr>
              <td
                style={{
                  padding: "32px 32px 24px",
                  background:
                    "radial-gradient(circle at top left, #E9D5FF 0, #F5F3FF 30%, #FFFFFF 70%)",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {/* Growth QR logo */}
                          <img
                            src="/icon.png"
                            alt="Growth QR logo"
                            width={40}
                            height={40}
                            style={{
                              display: "block",
                              borderRadius: "99px",
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              Growth QR
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6B7280",
                              }}
                            >
                              Turn reviews into revenue
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingTop: "24px" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#6B7280",
                            fontWeight: 600,
                          }}
                        >
                          Welcome to Growth QR
                        </p>
                        <h1
                          style={{
                            margin: "8px 0 0",
                            fontSize: "24px",
                            lineHeight: "32px",
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          Your account is ready to use
                        </h1>
                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: "14px",
                            lineHeight: "22px",
                            color: "#4B5563",
                          }}
                        >
                          We&apos;re excited to have your business on Growth QR.
                          Here are your account details and next steps to log in
                          and start turning great experiences into public
                          reviews.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Slot 2 – Login details & primary CTA */}
            <tr>
              <td
                style={{
                  padding: "24px 32px 8px",
                }}
              >
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    borderCollapse: "collapse",
                    backgroundColor: "#F9FAFB",
                    borderRadius: "12px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "20px 20px 16px",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 12px",
                            fontSize: "13px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#6B7280",
                            fontWeight: 600,
                          }}
                        >
                          Your account details
                        </p>

                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    color: "#9CA3AF",
                                    marginBottom: "4px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Login ID
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      fontFamily:
                                        'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                      fontSize: "13px",
                                      color: "#111827",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {PLACEHOLDER_USER_ID}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(
                                        PLACEHOLDER_USER_ID,
                                        "userId"
                                      )
                                    }
                                    className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                    }}
                                    title="Copy login ID"
                                    aria-label="Copy login ID"
                                  >
                                    {copiedField === "userId" ? (
                                      <Check
                                        size={16}
                                        className="text-emerald-600"
                                      />
                                    ) : (
                                      <Copy size={16} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ height: "8px" }}>&nbsp;</td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    color: "#9CA3AF",
                                    marginBottom: "4px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Temporary password
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      fontFamily:
                                        'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                      fontSize: "13px",
                                      color: "#111827",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {PLACEHOLDER_PASSWORD}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(
                                        PLACEHOLDER_PASSWORD,
                                        "password"
                                      )
                                    }
                                    className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                    }}
                                    title="Copy password"
                                    aria-label="Copy password"
                                  >
                                    {copiedField === "password" ? (
                                      <Check
                                        size={16}
                                        className="text-emerald-600"
                                      />
                                    ) : (
                                      <Copy size={16} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p
                          style={{
                            margin: "12px 0 0",
                            fontSize: "12px",
                            lineHeight: "18px",
                            color: "#6B7280",
                          }}
                        >
                          For your security, you&apos;ll be asked to change this
                          password the first time you log in.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style={{
                          padding: "0 20px 20px",
                          textAlign: "left",
                        }}
                      >
                        {/* Primary CTA – Login Button */}
                        <a
                          href="https://qr.tribly.ai/login"
                          style={{
                            display: "inline-block",
                            backgroundColor: "#7C3AED",
                            color: "#FFFFFF",
                            textDecoration: "none",
                            textAlign: "center",
                            padding: "12px 20px",
                            borderRadius: "0px",
                            fontSize: "14px",
                            fontWeight: 500,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          Log in to your dashboard
                        </a>
                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: "11px",
                            lineHeight: "16px",
                            color: "#9CA3AF",
                          }}
                        >
                          Or copy and paste this link into your browser:{" "}
                          <span style={{ color: "#4B5563" }}>
                            https://qr.tribly.ai/login
                          </span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Slot 3 – Advantages / value props */}
            <tr>
              <td
                style={{
                  padding: "8px 32px 24px",
                }}
              >
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "13px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#6B7280",
                            fontWeight: 600,
                          }}
                        >
                          Why businesses love Growth QR
                        </p>
                        <p
                          style={{
                            margin: "0 0 12px",
                            fontSize: "14px",
                            lineHeight: "22px",
                            color: "#4B5563",
                          }}
                        >
                          From the moment you log in, you&apos;ll have a clear,
                          real-time view of how your reputation drives growth.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 0",
                                  borderTop: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      minWidth: "20px",
                                      borderRadius: "999px",
                                      backgroundColor: "#EEF2FF",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check
                                      size={12}
                                      strokeWidth={2.4}
                                      color="#4F46E5"
                                      style={{ display: "block" }}
                                    />
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#111827",
                                      }}
                                    >
                                      AI feedback suggestions
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "20px",
                                        color: "#6B7280",
                                      }}
                                    >
                                      AI suggests relevant reply options based on
                                      the feedback—send the one you prefer.
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 0",
                                  borderTop: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      minWidth: "20px",
                                      borderRadius: "999px",
                                      backgroundColor: "#EEF2FF",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check
                                      size={12}
                                      strokeWidth={2.4}
                                      color="#4F46E5"
                                      style={{ display: "block" }}
                                    />
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#111827",
                                      }}
                                    >
                                      AI Auto Reply
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "20px",
                                        color: "#6B7280",
                                      }}
                                    >
                                      Automatically respond to reviews and
                                      messages in real time.
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 0",
                                  borderTop: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      minWidth: "20px",
                                      borderRadius: "999px",
                                      backgroundColor: "#EEF2FF",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check
                                      size={12}
                                      strokeWidth={2.4}
                                      color="#4F46E5"
                                      style={{ display: "block" }}
                                    />
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#111827",
                                      }}
                                    >
                                      SEO Boost
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "20px",
                                        color: "#6B7280",
                                      }}
                                    >
                                      Higher ratings and fresh reviews improve
                                      local rankings and increase discovery on
                                      Google.
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "10px 0",
                                  borderTop: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      minWidth: "20px",
                                      borderRadius: "999px",
                                      backgroundColor: "#EEF2FF",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check
                                      size={12}
                                      strokeWidth={2.4}
                                      color="#4F46E5"
                                      style={{ display: "block" }}
                                    />
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#111827",
                                      }}
                                    >
                                      Dynamic dashboard
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        lineHeight: "20px",
                                        color: "#6B7280",
                                      }}
                                    >
                                      Track reviews, ratings, engagement, and
                                      growth trends in one real-time dashboard.
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Slot 4 – Footer */}
            <tr>
              <td
                style={{
                  padding: "16px 32px 24px",
                  backgroundColor: "#F9FAFB",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "12px",
                            lineHeight: "18px",
                            color: "#6B7280",
                          }}
                        >
                          Need help getting started?
                          <br />
                          Reply to this email or contact us at{" "}
                          <a
                            href="mailto:connect@tribly.ai"
                            style={{
                              color: "#4F46E5",
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            connect@tribly.ai
                          </a>
                          .
                        </p>
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: "11px",
                            lineHeight: "16px",
                            color: "#9CA3AF",
                          }}
                        >
                          You&apos;re receiving this email because your
                          business was onboarded to Growth QR. If this wasn&apos;t
                          you, please let us know immediately.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingTop: "12px" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            lineHeight: "16px",
                            color: "#9CA3AF",
                            textAlign: "left",
                          }}
                        >
                          © {new Date().getFullYear()} Growth QR. All rights
                          reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}

