# UX suggestions applied on `booking-flow-edits`

Best-practice improvements to the booking request flow, each small enough to
revert independently. The faithful rebuild lives on
`claude/kiki-booking-flow-redesign-e0rhj6` for comparison.

## 1. Dates — early price transparency

The cost of the stay now appears the moment a valid range is selected
("5 × £35 = **£175** rent" inside the Selected Dates card), and the card shows
the actual dates ("21st Aug → 26th Aug · 5 nights"), not just a night count.
Rationale: users shouldn't have to commit to a step change to learn the price;
late price reveals are a top abandonment driver in booking funnels.

## 2. Dates — actionable "full duration" tip

"book for the full duration to be top pick" now carries a **Select all**
button that selects the whole availability in one tap (and flips to
"✓ Selected"). Make the recommended behavior the easiest behavior.

## 3. Dates — selection guidance

A short hint under the tip ("Tap your move-in date to start" → "Now tap your
move-out date") tells first-time users what the next tap does.

## 4. Payment — self-explanatory line items

"Rent" shows its derivation *(5 nights × £35)* and the security deposit is
labelled *(refunded after your stay)*. Unexplained charges erode trust at the
exact moment it matters most.

## 5. Guests — explained disabled state

The greyed-out Couple option now says why: "Ieva's place isn't open to
couples". Unexplained disabled controls read as bugs.

## 6. Intro — visible constraint instead of hidden error

A live counter under the intro field ("43 / 100 characters minimum" →
"✓ Looks good") replaces the surprise validation error after tapping Send.

## 7. Intro — pre-send recap

A compact "You're requesting" card above the send button summarises listing,
dates, guest count, and total — plus the reassurance "no payment taken until
Ieva accepts". Last-moment confirmation prevents wrong-date requests;
the payment reassurance addresses the #1 hesitation at send time.

## 8. Progress — orientation label

"Step 1 of 4 · Dates" above the progress bar so users know where they are and
how much is left. (The bar alone shows movement, not location.)

## 9. Close guard — confirm before losing progress

Closing the flow mid-way now asks "Leave booking?" (the production app does
this via a native alert; the prototype previously discarded progress
silently).

## 10. Rank — inline stakes explainer

The rank screen now states what ranking does: "Your #1 request is prioritised
— if two of your requests get accepted, we'll book the higher-ranked one."
Previously this lived behind an info icon; a forced step should explain
itself.

---

# Round 2 — bigger ideas, applied on `booking-flow-bigger-ideas`

## 11. Merged Dates + Payment into one step (flow is now 3 steps)

The payment preview was purely informational — its own step added a tap
without adding a decision. The breakdown (schedule graphic, summary,
split-payment note) now renders under the calendar the moment a valid range
exists, so choosing dates and seeing their cost are one motion. Progress
label reads "Dates & payments".

## 12. Availability context up front

A tinted chip under the step title states the host's window in words:
"Ieva's dates: 21st Aug – 26th Aug · 5 nights". Disabled calendar cells alone
made users discover the window by trial and error. The calendar also now
supports multi-month availability with named prev/next arrows ("‹ Aug",
"Sep ›"), matching the production DatesStep.

## 13. Intro prompt chips

Four sentence-starter chips under the intro field ("Why I'm in town",
"What I do", "My interests", "At home") append a starter line to the message
and flip to a used state. Beats blank-page paralysis, and nudges intros
toward what hosts actually want to know — raising intro quality raises
acceptance rates, which the 100-char minimum alone can't do.

## 14. 45+ day split-payment path modelled

Jake's listing now has a 76-night window to exercise it: stays of 45+ nights
split rent into ~30-night blocks (first due on signing, the rest due at each
block start), rendered with the stacked multi-payment schedule graphic and
the "you can request to split your payment" note from the production app.
This also demos the seasonal min-stay rule at scale (50% of 76 nights = 38
nights minimum) — the "Select all" tip makes the valid path one tap.
