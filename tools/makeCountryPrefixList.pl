#!/usr/bin/perl

use JSON;
use Data::Dumper;

# Read list of ISO 3166-2 country codes
open(ISOCC, "isocodes.txt");
$countrycodes = {};
while (<ISOCC>) {
	s/[\r\n]*$//;
	my ($country, $code) = split(/\t/);
	$countrycodes->{$country} = $code;
}

# Prefix hints
my $hints = {
	'A' => ['US', 'NA'],
	'B' => ['CN', 'AS'],
	'D' => ['DE', 'EU'],
	'E' => ['ES', 'EU'],
	'FT' => ['FR', 'AF'],
	'J' => ['JP', 'AS']
};

my $cur_continent;
my $cur_countrycode;
my $prefix_to_countrycode = {};
while (<>) {
	my $line = $_;
	$line =~ s/[\r\n]*$//;
	if ($line =~ /^\S/) {
		my @flds = split(/:\s*/, $line);
		my $countryname = $flds[0];
		$cur_continent = $flds[3];
		$cur_countrycode = $countrycodes->{$countryname};
		if (!$cur_countrycode) {
			print STDERR "*** No country code found for '$countryname'\n";
		}
	} elsif ($line =~ /^    (.+)$/) {
		my @newprefixes = split(/[,;]/, $1);
		for my $prefix (@newprefixes) {
			next if (!$prefix);
			next if ($prefix =~ /^=/);
			$prefix =~ s/\(\d+\)//;
			$prefix =~ s/\[\d+\]//;
			$prefix =~ s/^=//;

			if ($cur_countrycode && $cur_continent) {
				if ($prefix_to_countrycode->{$prefix} && $prefix_to_countrycode->{$prefix}->[0] ne $cur_countrycode) {
					print STDERR "*** Prefix $prefix conflicts: $prefix_to_countrycode->{$prefix}->[0] / $cur_countrycode\n";
				} else {
					$prefix_to_countrycode->{$prefix} = [$cur_countrycode, $cur_continent];
				}
			}
		}
	}
}

# Add hints
foreach my $prefix (keys %$hints) {
	if (!$prefix_to_countrycode->{$prefix}) {
		$prefix_to_countrycode->{$prefix} = $hints->{$prefix};
	}
}

# Try to consolidate prefixes into shorter ones
my $consolidated;
do {
	$consolidated = 0;
	my @prefixes = sort keys %$prefix_to_countrycode;
	foreach my $prefix (@prefixes) {
		my $hintprefix = $prefix;
		while (length($hintprefix) > 0) {
			$hintprefix = substr($hintprefix, 0, -1);
			if ($prefix_to_countrycode->{$hintprefix}) {
				last;
			}
		}
		if ($hintprefix && $prefix_to_countrycode->{$hintprefix}->[0] eq $prefix_to_countrycode->{$prefix}->[0] && $prefix_to_countrycode->{$hintprefix}->[1] eq $prefix_to_countrycode->{$prefix}->[1]) {
			#print "Eliminate prefix $prefix with $hintprefix\n";
			delete $prefix_to_countrycode->{$prefix};
			$consolidated = 1;
		}
	}
} while ($consolidated);

#my @prefixes = sort keys %$prefix_to_countrycode;
#foreach my $prefix (@prefixes) {
#	print "$prefix\t$prefix_to_countrycode->{$prefix}->[0]\t$prefix_to_countrycode->{$prefix}->[1]\n";
#}

my $json = new JSON();
$json->canonical();
$json->pretty();
print $json->encode($prefix_to_countrycode);

sub slurp {
	my $file = shift;
	open my $fh, '<', $file or die;
	local $/ = undef;
	my $cont = <$fh>;
	close $fh;
	return $cont;
}
