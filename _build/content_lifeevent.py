# -*- coding: utf-8 -*-
"""Sales-acceleration Priority 1 — life-event conversion landing pages.
Conversion-first (Situation -> Risk -> Without a will -> With a will -> How
ClearLegacy helps -> CTA). CTA -> /wills/ (verified 200). NO human-review claims
(claims-policy compliant). Full schema via build_phase7 template.

NOTE: /wills-for-unmarried-couples already exists on the live site
(/wills-for-unmarried-couples-uk) + a visual guide — so it is intentionally NOT
rebuilt here to avoid a duplicate (the dedupe commit removed stubs). Link to the
existing one instead.
"""
from content_phase7 import PAGES, WILL_SOURCES

LIFE_CTA = {"h": "Protect your family — start your will today.",
            "p": "ClearLegacy guides you through a valid England &amp; Wales will online, clearly and affordably.",
            "btn": "Start your will", "href": "/wills/"}
def sticky(msg): return (msg, "Start your will", "/wills/")

PROBATE_CTA = {"h": "Dealing with an estate? Start here.",
               "p": "ClearLegacy's free guides and probate calculator help executors handle the estate, step by step.",
               "btn": "Probate help for executors", "href": "/probate-for-executors"}

def life(slug, title, meta, h1, meta_line, quick, body, faq, related, example=None, note=None,
         stickymsg="Just had a big life change?", cta=None, sticky_tuple=None, sources=None, detail_h="What this means for you"):
    PAGES.append({
        "slug": slug, "title": title, "meta": meta, "h1": h1, "meta_line": meta_line,
        "cluster_name": "Life events", "cluster_url": "wills/", "detail_h": detail_h,
        "quick": quick, "body": body, "faq": faq, "sources": sources or WILL_SOURCES, "related": related,
        "example": example, "example_label": "Real example", "note": note,
        "cta": cta or LIFE_CTA, "sticky": sticky_tuple or sticky(stickymsg),
    })

# 1 -----------------------------------------------------------------------
life("wills-after-buying-a-house",
 "We Just Bought a House — Do We Need a Will? UK 2026 | ClearLegacy",
 "Just bought a house? You need a will. Without one, the intestacy rules — not you — decide who inherits your share, and an unmarried partner could be left with nothing. Here's what to do.",
 "We just bought a house — do we need a will?",
 "Wills &middot; Buying a home",
 "Yes. Buying a home is one of the clearest moments to make a will. Your property is likely your biggest asset, and <strong>how you own it decides what happens to your share</strong>. Without a will, the <strong>intestacy rules</strong> decide who inherits &mdash; and an <strong>unmarried partner can be left with nothing</strong>. A will lets you choose, and protect whoever you live with.",
 """  <h3>The risk</h3>
  <p>Most couples don't realise that <strong>how you own the property</strong> changes everything. As <em>joint tenants</em>, your share passes automatically to the co-owner. As <em>tenants in common</em>, your share passes under your will &mdash; or, if you have no will, under the intestacy rules.</p>
  <h3>What happens without a will</h3>
  <ul>
    <li>The <strong>intestacy rules</strong> decide who inherits your share &mdash; not you.</li>
    <li>An <strong>unmarried partner inherits nothing</strong> automatically, however long you've been together or however much you both paid.</li>
    <li>Your family could be left sharing ownership of a home with people you never intended.</li>
  </ul>
  <h3>What happens with a will</h3>
  <ul>
    <li>You decide who inherits your share of the home.</li>
    <li>You can protect a partner's right to stay in the property.</li>
    <li>You appoint executors to handle it smoothly, sparing your family stress and delay.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy guides you through a valid England &amp; Wales will online &mdash; it prompts you on exactly these property decisions (ownership type, who inherits your share, protecting a partner) so nothing is missed. It's quick, affordable, and clear about when a more complex estate needs a solicitor.</p>""",
 [("Do we need a will after buying a house?",
   "Yes. Your home is likely your biggest asset, and without a will the intestacy rules decide who inherits your share — potentially leaving an unmarried partner with nothing. A will lets you choose."),
  ("Does my partner automatically inherit our house?",
   "Only if you own it as joint tenants, where your share passes to the co-owner automatically. As tenants in common, your share passes under your will — or under intestacy if you have none. Unmarried partners have no automatic right.")],
 [("Who inherits a jointly owned property?", "/knowledge-base/who-inherits-a-jointly-owned-property.html"),
  ("Can I leave my house to my children?", "/can-i-leave-my-house-to-my-children"),
  ("We own a house together but aren't married", "/scenarios/we-own-a-house-together-but-arent-married.html")],
 example="Jo and Sam buy a flat together, unmarried, as joint tenants. Sam dies without a will. Because they're joint tenants, the flat passes to Jo automatically &mdash; but Sam's savings pass under intestacy to his parents, not Jo. Had they been tenants in common with no will, Jo could have lost the flat too. A will would have made their wishes certain.",
 stickymsg="Just bought a home?")

# 2 -----------------------------------------------------------------------
life("wills-after-having-a-baby",
 "We Just Had a Baby — Do We Need a Will? UK 2026 | ClearLegacy",
 "New baby? A will is how you legally name who would raise your child if the worst happened. Without one, a court decides. Plus how to set aside money for them properly.",
 "We just had a baby — do we need a will?",
 "Wills &middot; New parents",
 "Yes &mdash; and the most important reason isn't money, it's <strong>guardianship</strong>. A will is the <strong>only way to legally name who would raise your child</strong> if both parents died. Without one, a <strong>court decides who looks after your children</strong>, which may not be who you'd choose. A will also lets you set money aside for them in a trust until they're old enough.",
 """  <h3>The risk</h3>
  <p>New parents put it off &mdash; but a baby is exactly when a will matters most. If both parents (with parental responsibility) died without naming a guardian, the decision about who raises your child goes to the family courts.</p>
  <h3>What happens without a will</h3>
  <ul>
    <li><strong>No appointed guardian</strong> &mdash; a court decides who raises your children.</li>
    <li>Money for your child isn't ring-fenced or managed the way you'd want.</li>
    <li>The intestacy rules, not you, decide how your estate is shared.</li>
  </ul>
  <h3>What happens with a will</h3>
  <ul>
    <li>You <strong>name a guardian</strong> (and a backup) to raise your children.</li>
    <li>You can set up a <strong>trust</strong> so money is managed for them until a chosen age.</li>
    <li>You choose executors and exactly who inherits.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy's guided online will prompts new parents on the decisions that matter &mdash; naming guardians, substitutes, and a trust for your children &mdash; so the protection is actually in place, not just intended.</p>""",
 [("Do new parents need a will?",
   "Yes. A will is the only way to legally name a guardian to raise your child if both parents die. Without one, a court decides. A will also lets you set money aside in a trust for your children."),
  ("How do I appoint a guardian for my baby?",
   "You appoint a guardian in your will. They take parental responsibility if both parents with parental responsibility die while the child is under 18. Choose someone willing and able, and name a backup.")],
 [("How do I appoint a guardian for my child?", "/how-do-i-appoint-a-guardian-for-my-child"),
  ("I have young children", "/scenarios/i-have-young-children.html"),
  ("Do I need a trust?", "/do-i-need-a-trust")],
 example="Priya and Tom have their first baby and assume their families would 'sort it out' if anything happened. In fact, with no will and no named guardian, a court would decide. They make mirror wills naming Priya's sister as guardian and a trust for the baby &mdash; sorted in one evening.",
 stickymsg="New baby? Protect them today.")

# 3 -----------------------------------------------------------------------
life("recently-married-update-your-will",
 "Recently Married? Marriage Cancels Your Will — UK 2026 | ClearLegacy",
 "Getting married usually revokes your existing will in England & Wales. If you made a will before the wedding, you likely need a new one now — or the intestacy rules apply. What to do.",
 "Recently married? Your old will may no longer exist",
 "Wills &middot; Just married",
 "Congratulations &mdash; but be warned: in England and Wales, <strong>marriage automatically revokes (cancels) any will you made before it</strong> (unless the will was made in express contemplation of that marriage). So if you had a will before the wedding, you're likely now treated as having <strong>no will at all</strong>, and the <strong>intestacy rules</strong> would apply. Making a new will fixes it.",
 """  <h3>The risk</h3>
  <p>Most people don't know that marriage wipes out an earlier will (section 18, Wills Act 1837). Couples often think their pre-wedding wishes still stand &mdash; they usually don't.</p>
  <h3>What happens without a (new) will</h3>
  <ul>
    <li>Your old will is <strong>revoked</strong> by the marriage &mdash; it no longer counts.</li>
    <li>The <strong>intestacy rules</strong> decide who inherits, which may not match your wishes (a spouse doesn't automatically get everything once there are children).</li>
    <li>Anyone you'd named in the old will &mdash; perhaps from a previous relationship &mdash; may lose out entirely.</li>
  </ul>
  <h3>What happens with a new will</h3>
  <ul>
    <li>Your wishes as a married couple are recorded properly.</li>
    <li>You can provide for your spouse <em>and</em> children from any previous relationship.</li>
    <li>You appoint executors and, if needed, guardians.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy makes the replacement will simple &mdash; a guided online questionnaire for England &amp; Wales, often completed in one sitting, so your post-marriage wishes are valid and clear.</p>""",
 [("Does getting married cancel my will?",
   "Usually yes. In England and Wales marriage automatically revokes an existing will, unless the will was made in express contemplation of that marriage. After marrying you normally need to make a new will."),
  ("What if I don't make a new will after marrying?",
   "Your old will is revoked, so you're treated as having no will, and the intestacy rules decide who inherits. That may not leave everything to your spouse where there are children.")],
 [("Does marriage revoke a will?", "/knowledge-base/does-marriage-revoke-a-will.html"),
  ("How often should I update my will?", "/how-often-should-i-update-my-will"),
  ("What is a mirror will?", "/knowledge-base/what-is-a-mirror-will.html")],
 example="Mark made a will leaving everything to his daughter, then married Lucy a year later. The marriage revoked that will. When Mark dies, intestacy &mdash; not his old will &mdash; applies, splitting his estate between Lucy and his daughter in fixed shares. A new will after the wedding would have set out exactly what he wanted.",
 stickymsg="Just married? Update your will.")

# 4 -----------------------------------------------------------------------
life("recently-divorced-update-your-will",
 "Recently Divorced? Update Your Will — UK 2026 | ClearLegacy",
 "Divorce doesn't cancel your will, but it treats your ex-spouse as having died — which can leave gaps or unintended outcomes. Why you should review and update your will after divorce.",
 "Recently divorced? Your will needs a review",
 "Wills &middot; After divorce",
 "Divorce <strong>doesn't revoke your will</strong>, but once the divorce is final your <strong>ex-spouse is treated as having died</strong> for the will's purposes &mdash; so any gift to them, or their appointment as executor, fails. That can leave <strong>gaps or unintended outcomes</strong> (for example, no working executor, or the estate falling into intestacy). Reviewing and updating your will after divorce is essential.",
 """  <h3>The risk</h3>
  <p>People assume divorce either changes nothing or changes everything &mdash; the reality is in between, and the gaps it creates can be costly.</p>
  <h3>What happens if you don't update it</h3>
  <ul>
    <li>Gifts to your ex-spouse and their appointment as executor <strong>fail</strong> &mdash; which can leave your will without a working executor or residuary beneficiary.</li>
    <li>Parts of your estate may fall into <strong>intestacy</strong> if the gaps aren't covered.</li>
    <li>A <strong>new partner</strong> you haven't married has no automatic right to inherit &mdash; only a will can provide for them.</li>
  </ul>
  <h3>What happens when you update it</h3>
  <ul>
    <li>Your wishes reflect your life now &mdash; new beneficiaries, executors and guardians.</li>
    <li>You close the gaps divorce created, so nothing falls into intestacy.</li>
    <li>You can provide for a new partner or children from a new relationship.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy's guided online will makes the update straightforward &mdash; rebuild your wishes cleanly for England &amp; Wales rather than relying on a patched, outdated document.</p>""",
 [("Does divorce cancel my will?",
   "No. Divorce doesn't revoke your will, but once it's final your ex-spouse is treated as having died for the will's purposes — so gifts to them and their role as executor fail. This can create gaps, so update your will."),
  ("Should I make a new will after divorce?",
   "Yes. Updating or replacing your will after divorce closes the gaps caused by your ex being treated as predeceased, and lets you provide for a new partner or children, who have no automatic right otherwise.")],
 [("Does divorce affect a will?", "/knowledge-base/does-divorce-affect-a-will.html"),
  ("How often should I update my will?", "/how-often-should-i-update-my-will"),
  ("Can unmarried partners inherit?", "/knowledge-base/can-unmarried-partners-inherit.html")],
 example="After her divorce, Aisha forgets her will still names her ex-husband as sole executor and beneficiary. On her death, those gifts fail and her estate falls partly into intestacy, with no clear executor. A quick post-divorce update would have named her sister and children instead.",
 stickymsg="Divorced? Review your will.")

ADMIN_SOURCES = [
 "GOV.UK — <em>What to do when someone dies: step by step</em>",
 "GOV.UK — <em>Applying for probate</em>",
 "Citizens Advice — <em>Dealing with the estate of someone who has died</em>",
]

# ---- TIER 2 ----------------------------------------------------------------

# 5 -----------------------------------------------------------------------
life("going-on-holiday-estate-planning-checklist",
 "Going on Holiday? Estate Planning Checklist UK 2026 | ClearLegacy",
 "Heading abroad? A quick estate-planning checklist before you travel: make or update your will, check guardians for your children, and tell someone where your documents are. Sort it in minutes.",
 "Going on holiday? Your before-you-travel estate checklist",
 "Wills &middot; Before you travel",
 "A trip abroad is the nudge many people need to get their affairs in order. Before you go, run through a short checklist: <strong>make or update your will, name guardians for any children, check your pension nomination, and tell someone trusted where your documents are</strong>. A valid will can be made online and signed the <strong>same day</strong> &mdash; so it's easy to tick off before you fly.",
 """  <h3>Why now</h3>
  <p>You insure your trip and your bags &mdash; but the bigger risk to your family is having no will. Travel is simply a good prompt to fix that.</p>
  <h3>Your before-you-travel checklist</h3>
  <ul>
    <li><strong>Make or update your will</strong> &mdash; especially if you've married, had a baby, bought a home or divorced since your last one.</li>
    <li><strong>Name guardians</strong> for any children under 18.</li>
    <li><strong>Check your pension/life-policy nomination</strong> &mdash; it passes outside your will, so keep it current.</li>
    <li><strong>Tell a trusted person</strong> where your will and key documents are.</li>
    <li>Consider a <strong>lasting power of attorney</strong> in case of incapacity while away.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy's guided online will is built for exactly this &mdash; complete it in one sitting, print and sign with two witnesses, and it's legally valid the same day. Sorted before you pack.</p>""",
 [("Should I make a will before going on holiday?",
   "It's a sensible precaution, especially for long trips or if you have dependants or property. You can make a valid UK will the same day online, then sign it with two independent witnesses before you travel."),
  ("Can I make a will quickly before I fly?",
   "Yes. A will is legally valid as soon as it's correctly signed and witnessed — there's no waiting period — so you can complete one online and sign it the same day.")],
 [("Can I write a will before travelling?", "/can-i-write-a-will-before-travelling"),
  ("What is the fastest way to make a valid will?", "/fastest-way-to-make-a-valid-will"),
  ("Do I need a lasting power of attorney?", "/do-i-need-a-lasting-power-of-attorney")],
 example="Two days before a month-long trip, Dan completes his will online, signs it with two friends, names his brother as guardian for his daughter, and leaves the signed will with his sister. He flies knowing his family is protected.",
 stickymsg="Travelling soon? Sort your will.")

# 6 -----------------------------------------------------------------------
life("my-parent-has-died-what-next",
 "My Parent Has Died — What Do I Do Next? UK 2026 | ClearLegacy",
 "Losing a parent is hard. Here are the practical steps in order: register the death, find the will, deal with the funeral, then value the estate and apply for probate. A clear guide.",
 "My parent has died — what do I do next?",
 "After a death &middot; Probate",
 "First, the practical steps in order: <strong>get the medical certificate, register the death within five days, and arrange the funeral</strong>. Then, if you're the executor or next of kin, you'll <strong>find the will, value the estate, deal with any inheritance tax, and apply for probate</strong> where needed. It's a lot &mdash; taking it one step at a time makes it manageable.",
 """  <h3>The first practical steps</h3>
  <ol>
    <li>Obtain the <strong>medical certificate of cause of death</strong>.</li>
    <li><strong>Register the death</strong> within five days (England &amp; Wales) and get several certified copies of the certificate.</li>
    <li>Arrange the <strong>funeral</strong> &mdash; the will may state wishes.</li>
  </ol>
  <h3>Then the estate</h3>
  <ul>
    <li><strong>Find the will</strong> and identify the executors. No will? The intestacy rules apply and the next of kin become administrators.</li>
    <li><strong>Value the estate</strong>, deal with inheritance tax, and <strong>apply for probate</strong> if it's needed.</li>
    <li>Collect in the assets, pay debts, then distribute to the beneficiaries.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>Our free, plain-English guides and the probate calculator walk executors through each step &mdash; what probate costs, how long it takes, and what an executor must do. And many people, after dealing with a parent's estate, decide to make their own will so their family is spared the uncertainty.</p>""",
 [("What do I do when a parent dies in the UK?",
   "Get the medical certificate, register the death within five days, and arrange the funeral. Then, as executor or next of kin, find the will, value the estate, deal with inheritance tax, and apply for probate if needed."),
  ("Do I need probate when a parent dies?",
   "Often yes, if there's property in their sole name or significant assets institutions won't release without a grant. Small estates or jointly owned assets passing by survivorship may not need it.")],
 [("What happens after someone dies?", "/what-happens-after-someone-dies"),
  ("How do I apply for probate?", "/how-do-i-apply-for-probate"),
  ("Probate for executors", "/probate-for-executors"),
  ("How to close bank accounts after death", "/how-to-close-bank-accounts-after-death")],
 example="When his mother dies, Sam registers the death within five days, orders several certified copies, and arranges the funeral. As named executor he then values her estate, finds no inheritance tax is due, and applies for probate &mdash; handling it step by step with the guides.",
 note="<strong>Take your time.</strong> There's no rush in the first days beyond registering the death and the funeral. The estate admin can follow once you're ready.",
 cta=PROBATE_CTA, sticky_tuple=("Lost a parent? Practical help.", "Probate help", "/probate-for-executors"),
 sources=ADMIN_SOURCES, detail_h="The steps, in order")

# 7 -----------------------------------------------------------------------
life("i-have-been-named-executor",
 "I've Been Named an Executor — What Now? UK 2026 | ClearLegacy",
 "Named as an executor? Here's what it means, what you have to do, and how to limit your personal liability — from valuing the estate and applying for probate to distributing to beneficiaries.",
 "I've been named an executor — what now?",
 "Executors &middot; Getting started",
 "Being an executor means you're responsible for <strong>carrying out the will</strong>: valuing the estate, applying for probate, paying debts and tax, and distributing to the beneficiaries. You can <strong>say no</strong> (renounce) before you start, but once you begin acting it's hard to step back. You can also be <strong>personally liable</strong> for mistakes &mdash; so accuracy and good records matter.",
 """  <h3>What you'll need to do</h3>
  <ul>
    <li><strong>Find the will</strong> and confirm your appointment; get certified copies of the death certificate.</li>
    <li><strong>Value the estate</strong> and deal with any inheritance tax.</li>
    <li><strong>Apply for the grant of probate</strong> (&pound;300; &pound;16 per extra copy).</li>
    <li><strong>Collect in assets, pay debts</strong>, keep estate accounts, then <strong>distribute</strong> to beneficiaries.</li>
  </ul>
  <h3>Protect yourself</h3>
  <ul>
    <li>Value carefully and keep evidence.</li>
    <li>Place <strong>statutory creditor notices</strong> and wait six months after the grant before final distribution.</li>
    <li>Take advice on anything complex (business assets, trusts, disputes).</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>Our executor and probate guides &mdash; plus the free probate calculator &mdash; walk you through each step and how to limit your personal liability. You don't have to do it from memory.</p>""",
 [("What does it mean to be named an executor?",
   "You're responsible for carrying out the will — valuing the estate, applying for probate, paying debts and tax, and distributing to beneficiaries. You can renounce before you start, but can be personally liable for mistakes once you act."),
  ("Do I have to act as executor?",
   "No. You can renounce the role, but only before you begin dealing with the estate. Once you've started acting, stepping back is much harder.")],
 [("Probate for executors", "/probate-for-executors"),
  ("Executor checklist", "/executor-checklist"),
  ("What documents does an executor need?", "/what-documents-does-an-executor-need"),
  ("Executor liability explained", "/executor-liability")],
 example="Tom learns he's the executor for his aunt. Before doing anything irreversible, he reads the executor checklist, gathers the will and death certificates, and values the estate &mdash; then applies for probate, placing creditor notices to protect himself before paying anyone out.",
 cta=PROBATE_CTA, sticky_tuple=("Named an executor?", "Executor help", "/probate-for-executors"),
 sources=ADMIN_SOURCES, detail_h="Your role, explained")

# 8 -----------------------------------------------------------------------
life("i-own-a-house-with-my-partner",
 "I Own a House With My Partner — Do We Need Wills? UK 2026 | ClearLegacy",
 "Owning a home with a partner? How you own it — joint tenants or tenants in common — decides what happens to your share. Unmarried partners have no automatic right. Why you both need a will.",
 "I own a house with my partner — do we need wills?",
 "Wills &middot; Co-owning property",
 "Yes &mdash; and the detail that matters most is <strong>how you own the property</strong>. As <strong>joint tenants</strong>, your share passes automatically to the other owner. As <strong>tenants in common</strong>, your share passes under your will &mdash; or, with no will, under the <strong>intestacy rules</strong>. If you're <strong>not married</strong>, your partner has <strong>no automatic right</strong> to inherit your share. A will makes your wishes certain.",
 """  <h3>The risk</h3>
  <p>Co-owners often assume the survivor automatically keeps everything. Whether that's true depends entirely on how the property is held &mdash; and on whether you're married.</p>
  <h3>What happens without wills</h3>
  <ul>
    <li><strong>Tenants in common + no will:</strong> your share passes under intestacy, which for an <strong>unmarried partner means they inherit nothing</strong> automatically.</li>
    <li>Your share could end up co-owned with relatives you never intended.</li>
    <li>A surviving partner may face uncertainty or even having to buy out your share.</li>
  </ul>
  <h3>What happens with wills</h3>
  <ul>
    <li>You each decide who inherits your share of the home.</li>
    <li>You can protect your partner's right to stay in the property (a life interest).</li>
    <li>You appoint executors and avoid the intestacy default.</li>
  </ul>
  <h3>How ClearLegacy helps</h3>
  <p>ClearLegacy's guided online wills prompt you both on ownership type and how to protect each other &mdash; quick, affordable, and clear about when a more complex estate needs a solicitor.</p>""",
 [("Do unmarried partners need wills if they own a house together?",
   "Yes — it's essential. An unmarried partner has no automatic right to inherit your share. How you own the property (joint tenants vs tenants in common) decides what happens, and a will makes your wishes certain."),
  ("What's the difference between joint tenants and tenants in common?",
   "As joint tenants, your share passes automatically to the co-owner on death. As tenants in common, you each own a distinct share that passes under your will — or under intestacy if you have no will.")],
 [("We own a house together but aren't married", "/scenarios/we-own-a-house-together-but-arent-married.html"),
  ("Who inherits a jointly owned property?", "/knowledge-base/who-inherits-a-jointly-owned-property.html"),
  ("Wills after buying a house", "/wills-after-buying-a-house"),
  ("Can unmarried partners inherit?", "/knowledge-base/can-unmarried-partners-inherit.html")],
 example="Unmarried and owning their flat as tenants in common, Mia and Jack have no wills. Jack dies; under intestacy his half passes to his parents, not Mia &mdash; who now co-owns her home with her late partner's family. Mirror wills leaving their shares to each other would have prevented it.",
 stickymsg="Own a home together? Protect each other.")
