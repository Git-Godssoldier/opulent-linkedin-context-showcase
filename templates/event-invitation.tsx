// Event invitation — React Email, Dither theme.
//
// Adapted from the Dither welcome template:
// https://github.com/resend/react-email/tree/canary/apps/demo/emails
//
// One deliberate change from the source layout: the welcome template offers three
// calls to action. This one offers exactly one. An invitation asking for three things
// has not decided what it is for, and it hands that decision to the reader in the
// second of attention they gave it.
//
// Every prop below is filled from the run, never written from imagination:
//   reason / reasonSourceUrl  <- the dossier's one dated signal, at its original strength
//   audienceLine              <- the scraped event page, not a claim about who will attend
//   eventName/Date/Venue/City <- the scraped event page
//   rsvpUrl                   <- the event page's own registration link
//
// A prop with no evidence behind it is omitted, and the section that would have used
// it does not render. Nothing here invents a reason to engage.

import {
  Body,
  Container,
  Column,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { DitherFonts } from './dither-fonts';
import { ditherTailwindConfig } from './theme';

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

interface EventInvitationProps {
  /** First name only. A full name in a greeting reads as a mail merge. */
  recipientFirstName: string;
  eventName: string;
  /** Already formatted for a reader, e.g. "Wednesday, September 24". */
  eventDate: string;
  eventCity: string;
  eventVenue?: string;
  /** The one dated, truthful reason this person is being written to now. */
  reason: string;
  /** The page that reason came from. Present whenever the reason is a public claim. */
  reasonSourceUrl?: string;
  /** Who is in the room, from the event page. Ranges and examples, not adjectives. */
  audienceLine: string;
  /** The event's own registration link. The single call to action. */
  rsvpUrl: string;
  senderName: string;
  senderTitle: string;
  communityName: string;
  unsubscribeUrl: string;
  /** Preview text. Extends the subject; never repeats it. */
  previewText: string;
}

export const EventInvitation = ({
  recipientFirstName,
  eventName,
  eventDate,
  eventCity,
  eventVenue,
  reason,
  reasonSourceUrl,
  audienceLine,
  rsvpUrl,
  senderName,
  senderTitle,
  communityName,
  unsubscribeUrl,
  previewText,
}: EventInvitationProps) => (
  <Tailwind config={ditherTailwindConfig}>
    <Html>
      <Head>
        <DitherFonts />
      </Head>
      <Body className="bg-bg-2 font-14 m-0 p-0 font-sans">
        <Preview>{previewText}</Preview>
        <Container className="bg-bg mx-auto max-w-[640px]">
          <Section className="mobile:px-4 px-6 py-6">
            <Img
              src={`${baseUrl}/static/shared/logo-white.png`}
              alt=""
              width="32"
              height="32"
              className="block"
            />
          </Section>

          {/* The reason this arrived now goes first. Not the community's story. */}
          <Section className="mobile:px-4 mobile:pt-10 mobile:pb-8 px-6 pt-16 pb-12">
            <Section align="left" className="mobile:!max-w-full max-w-[490px]">
              <Text className="font-14 text-fg-2 m-0 font-sans">
                {recipientFirstName} —
              </Text>
              <Text className="mobile:!max-w-full font-56 font-condensed mobile:font-40 text-fg m-0 mt-6 max-w-[490px] uppercase">
                {eventName}
              </Text>
              <Text className="mobile:!max-w-full font-14 text-fg-2 m-0 mt-8 max-w-[490px] font-sans">
                {reason}
                {reasonSourceUrl ? (
                  <>
                    {' '}
                    <Link href={reasonSourceUrl} className="text-fg-2">
                      (source)
                    </Link>
                  </>
                ) : null}
              </Text>
            </Section>
          </Section>

          <Section className="mobile:px-4 px-6">
            <Img
              src={`${baseUrl}/static/dither/dither-image-1.png`}
              alt=""
              width={592}
              className="block w-full max-w-[592px]"
            />
          </Section>

          {/* The event in one block: when, where, who is in the room. */}
          <Section className="mobile:px-4 mobile:pt-10 mobile:pb-8 px-6 pt-16 pb-12">
            <Text className="font-20 font-condensed text-fg m-0 uppercase">
              {eventDate} · {eventCity}
            </Text>
            {eventVenue ? (
              <Text className="font-13 text-fg-2 m-0 mt-2 font-sans">{eventVenue}</Text>
            ) : null}
            <Text className="mobile:!max-w-full font-14 text-fg-2 m-0 mt-6 max-w-[490px] font-sans">
              {audienceLine}
            </Text>
          </Section>

          {/* Exactly one action. */}
          <Section className="mobile:px-4 mobile:pb-10 border-stroke border-t px-6 pt-10 pb-14">
            <Link href={rsvpUrl} className="font-20 font-condensed text-fg uppercase">
              Reserve a seat →
            </Link>
          </Section>

          {/* A person signs it, not a department. */}
          <Section className="mobile:px-4 mobile:py-12 border-stroke border-t px-6 py-16">
            <Text className="font-15 text-fg m-0 font-sans">{senderName}</Text>
            <Text className="font-13 text-fg-2 m-0 mt-0.5 font-sans">
              {senderTitle}, {communityName}
            </Text>
            <Row align="left">
              <Column className="w-full pt-8 align-top">
                <Text className="font-11 text-fg-2 m-0 max-w-[320px] font-sans">
                  You are receiving this because you are part of the {communityName}{' '}
                  investor network.{' '}
                  <Link href={unsubscribeUrl} className="text-fg-2">
                    Unsubscribe
                  </Link>
                  .
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

// Preview props are placeholders for local rendering only. They are not a sample
// message and must never be sent.
EventInvitation.PreviewProps = {
  recipientFirstName: 'FIRST_NAME',
  eventName: 'EVENT_NAME',
  eventDate: 'EVENT_DATE',
  eventCity: 'EVENT_CITY',
  eventVenue: 'EVENT_VENUE',
  reason: 'ONE_DATED_REASON_FROM_THE_DOSSIER',
  reasonSourceUrl: 'https://example.com/source',
  audienceLine: 'WHO_IS_IN_THE_ROOM_FROM_THE_EVENT_PAGE',
  rsvpUrl: 'https://example.com/rsvp',
  senderName: 'SENDER_NAME',
  senderTitle: 'SENDER_TITLE',
  communityName: 'COMMUNITY_NAME',
  unsubscribeUrl: 'https://example.com/unsubscribe',
  previewText: 'PREVIEW_TEXT_EXTENDS_THE_SUBJECT',
} satisfies EventInvitationProps;

export default EventInvitation;
